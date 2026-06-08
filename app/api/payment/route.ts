import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { validateWalletAddress } from '../../lib/wagmi';
import { ApiResponse, PaymentRequest, CartItem } from '../../types';

export async function POST(request: NextRequest) {
  try {
    const { cartItems, totalAmount, userWallet, txHash }: PaymentRequest & { txHash: string } = await request.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid total amount is required' },
        { status: 400 }
      );
    }

    if (!userWallet || !validateWalletAddress(userWallet)) {
      return NextResponse.json(
        { success: false, error: 'Valid wallet address is required' },
        { status: 400 }
      );
    }

    if (!txHash) {
      return NextResponse.json(
        { success: false, error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('tx_hash', txHash)
      .single();

    if (existingOrder) {
      const { data: completeOrder } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price_at_time,
            products (
              id,
              name,
              price,
              image,
              description,
              category,
              tags,
              sizes,
              colors,
              in_stock,
              featured,
              inventory
            )
          )
        `)
        .eq('id', existingOrder.id)
        .single();

      const orderResponse = {
        id: completeOrder.id,
        userWallet: completeOrder.user_wallet,
        items: completeOrder.order_items.map((item: any) => ({
          product: {
            id: item.products.id,
            name: item.products.name,
            price: parseFloat(item.products.price),
            image: item.products.image,
            description: item.products.description,
            category: item.products.category,
            tags: item.products.tags || [],
            sizes: item.products.sizes || [],
            colors: item.products.colors || [],
            inStock: item.products.in_stock,
            featured: item.products.featured,
            inventory: item.products.inventory
          },
          quantity: item.quantity
        })),
        totalAmount: parseFloat(completeOrder.total_amount),
        status: completeOrder.status,
        txHash: completeOrder.tx_hash,
        createdAt: new Date(completeOrder.created_at),
        updatedAt: new Date(completeOrder.updated_at)
      };

      return NextResponse.json({
        success: true,
        data: { order: orderResponse }
      } as ApiResponse<{ order: any }>);
    }

    for (const item of cartItems) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('inventory, name')
        .eq('id', item.product.id)
        .single();

      if (productError) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.product.name}` },
          { status: 400 }
        );
      }

      if (product.inventory < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient inventory for ${item.product.name}. Available: ${product.inventory}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userWallet)
      .single();

    let userId: string;

    if (userError && userError.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ wallet_address: userWallet }])
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }
      userId = newUser.id;
    } else if (userError) {
      throw userError;
    } else {
      userId = user.id;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        user_wallet: userWallet,
        total_amount: totalAmount,
        status: 'confirmed',
        tx_hash: txHash
      }])
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price_at_time: item.product.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw itemsError;
    }

    for (const item of cartItems) {
      const { error: updateError } = await supabase.rpc('decrement_inventory', {
        product_id: item.product.id,
        decrement_by: item.quantity
      });

      if (updateError) {
        throw updateError;
      }
    }

    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price_at_time,
          products (
            id,
            name,
            price,
            image,
            description,
            category,
            tags,
            sizes,
            colors,
            in_stock,
            featured,
            inventory
          )
        )
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const orderResponse = {
      id: completeOrder.id,
      userWallet: completeOrder.user_wallet,
      items: completeOrder.order_items.map((item: any) => ({
        product: {
          id: item.products.id,
          name: item.products.name,
          price: parseFloat(item.products.price),
          image: item.products.image,
          description: item.products.description,
          category: item.products.category,
          tags: item.products.tags || [],
          sizes: item.products.sizes || [],
          colors: item.products.colors || [],
          inStock: item.products.in_stock,
          featured: item.products.featured,
          inventory: item.products.inventory
        },
        quantity: item.quantity
      })),
      totalAmount: parseFloat(completeOrder.total_amount),
      status: completeOrder.status,
      txHash: completeOrder.tx_hash,
      createdAt: new Date(completeOrder.created_at),
      updatedAt: new Date(completeOrder.updated_at)
    };

    return NextResponse.json({
      success: true,
      data: { order: orderResponse }
    } as ApiResponse<{ order: any }>);

  } catch (error: any) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment processing failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price_at_time,
          products (
            id,
            name,
            price,
            image,
            description,
            category,
            tags,
            sizes,
            colors,
            in_stock,
            featured,
            inventory
          )
        )
      `)
      .eq('user_wallet', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const ordersResponse = orders.map(order => ({
      id: order.id,
      userWallet: order.user_wallet,
      items: order.order_items.map((item: any) => ({
        product: {
          id: item.products.id,
          name: item.products.name,
          price: parseFloat(item.products.price),
          image: item.products.image,
          description: item.products.description,
          category: item.products.category,
          tags: item.products.tags || [],
          sizes: item.products.sizes || [],
          colors: item.products.colors || [],
          inStock: item.products.in_stock,
          featured: item.products.featured,
          inventory: item.products.inventory
        },
        quantity: item.quantity
      })),
      totalAmount: parseFloat(order.total_amount),
      status: order.status,
      txHash: order.tx_hash,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at)
    }));

    return NextResponse.json({
      success: true,
      data: { orders: ordersResponse }
    } as ApiResponse<{ orders: any[] }>);

  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}