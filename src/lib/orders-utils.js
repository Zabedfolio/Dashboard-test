/**
 * Format amount as Bangladeshi Taka
 */
export function formatOrderAmount(amount) {
  const num = Number(amount) || 0
  return '৳' + num.toLocaleString('en-BD', { maximumFractionDigits: 0 })
}

/**
 * Generate order ID: HB{DD}{MM}{YY}{sequence}
 * Example: HB07052601
 */
export function generateOrderIdFormat(date, sequence) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  const seq = String(sequence).padStart(2, '0')

  return `HB${day}${month}${year}${seq}`
}

/**
 * Get color for status badge
 */
export function getStatusColor(status) {
  const colorMap = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Confirmed': 'bg-blue-100 text-blue-800',
    'Processing': 'bg-indigo-100 text-indigo-800',
    'Shipped': 'bg-cyan-100 text-cyan-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Returned': 'bg-orange-100 text-orange-800'
  }

  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get display label for status
 */
export function getStatusLabel(status) {
  return status || 'Unknown'
}

/**
 * Format items for display
 */
export function formatItems(items) {
  if (!items || !Array.isArray(items)) {
    return 'No items'
  }

  if (items.length === 0) {
    return 'No items'
  }

  if (items.length === 1) {
    return `${items[0].qty}x ${items[0].name}`
  }

  return `${items.length} items`
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(items, shippingCharge = 0) {
  const itemsSubtotal = (items || []).reduce((sum, item) => {
    const subtotal = (Number(item.unit_price) || 0) * (Number(item.qty) || 0)
    const discount = Number(item.discount) || 0
    return sum + (subtotal - discount)
  }, 0)

  const shipping = Number(shippingCharge) || 0
  return itemsSubtotal + shipping
}

/**
 * Calculate items subtotal
 */
export function calculateItemsSubtotal(items) {
  return (items || []).reduce((sum, item) => {
    const subtotal = (Number(item.unit_price) || 0) * (Number(item.qty) || 0)
    const discount = Number(item.discount) || 0
    return sum + (subtotal - discount)
  }, 0)
}

/**
 * Check if order can be edited based on status
 */
export function isOrderEditable(status) {
  const uneditableStatuses = ['Delivered', 'Cancelled', 'Returned']
  return !uneditableStatuses.includes(status)
}

/**
 * Get status pipeline stages
 */
export function getStatusPipeline() {
  return ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered']
}

/**
 * Check if status can transition to another status
 */
export function canTransitionStatus(currentStatus, targetStatus) {
  const pipeline = getStatusPipeline()
  const currentIndex = pipeline.indexOf(currentStatus)
  const targetIndex = pipeline.indexOf(targetStatus)

  // Can move forward in pipeline or to cancelled/returned
  if (targetStatus === 'Cancelled' || targetStatus === 'Returned') {
    return currentStatus !== 'Delivered'
  }

  return targetIndex >= currentIndex
}

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(orders) {
  if (!orders || orders.length === 0) {
    console.warn('No orders to export')
    return
  }

  const headers = [
    'Order ID',
    'Customer Name',
    'Phone',
    'Total Amount',
    'Payment Status',
    'Order Status',
    'Created By',
    'Created At'
  ]

  const rows = orders.map(order => [
    order.order_id,
    order.customers?.name || 'N/A',
    order.customers?.phone || 'N/A',
    order.total_amount || 0,
    order.payment_status,
    order.order_status,
    order.profiles?.name || 'N/A',
    new Date(order.created_at).toLocaleDateString('en-BD')
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Format date for display
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format date only (no time)
 */
export function formatDateOnly(dateStr) {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayDateString() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}
