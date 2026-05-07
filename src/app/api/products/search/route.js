import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { searchProducts } from '@/lib/products'

export async function GET(request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 1) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const results = await searchProducts(query)

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search products' },
      { status: 500 }
    )
  }
}
