'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

export function CustomerLookup({
  onCustomerSelect,
  initialCustomer = null
}) {
  const [phone, setPhone] = useState(initialCustomer?.phone || '')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer)

  useEffect(() => {
    if (selectedCustomer) {
      onCustomerSelect(selectedCustomer)
    }
  }, [selectedCustomer, onCustomerSelect])

  const handlePhoneChange = async (e) => {
    const value = e.target.value
    setPhone(value)
    setSelectedCustomer(null)

    if (value.length < 3) {
      setSearchResults([])
      setIsOpen(false)
      return
    }

    setIsSearching(true)
    setIsOpen(true)

    try {
      const response = await fetch(
        `/api/customers/search?q=${encodeURIComponent(value)}`
      )
      const result = await response.json()

      if (response.ok) {
        setSearchResults(result.data || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setPhone(customer.phone)
    setIsOpen(false)
    onCustomerSelect(customer)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phone">Customer Phone *</Label>
        <div className="flex gap-2 mt-1.5">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter or search phone number"
                value={phone}
                onChange={handlePhoneChange}
                className="flex-1"
              />
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command shouldFilter={false}>
                {isSearching ? (
                  <div className="p-4 text-sm text-muted-foreground">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <CommandEmpty>
                    {phone.length >= 3 ? 'No customers found' : 'Type at least 3 characters'}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {searchResults.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        onSelect={() => handleSelectCustomer(customer)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {customer.phone}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {selectedCustomer && (
        <Card className="p-4 bg-muted/50">
          <h4 className="font-semibold text-sm mb-3">Customer Found</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{selectedCustomer.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <p className="font-medium">{selectedCustomer.phone}</p>
            </div>
            {selectedCustomer.email && (
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{selectedCustomer.email}</p>
              </div>
            )}
            {selectedCustomer.full_address && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Address:</span>
                <p className="font-medium">{selectedCustomer.full_address}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCustomer(null)
              setPhone('')
            }}
            className="mt-3"
          >
            Change Customer
          </Button>
        </Card>
      )}

      {!selectedCustomer && phone.length >= 10 && searchResults.length === 0 && (
        <Card className="p-4 border-dashed">
          <h4 className="font-semibold text-sm mb-2">New Customer</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Customer not found. Fill in the details below to create a new customer record.
          </p>
        </Card>
      )}
    </div>
  )
}
