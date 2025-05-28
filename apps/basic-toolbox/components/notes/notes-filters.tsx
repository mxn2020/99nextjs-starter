'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@99packages/ui/components/card'
import { Button } from '@99packages/ui/components/button'
import { Badge } from '@99packages/ui/components/badge'
import { Separator } from '@99packages/ui/components/separator'
import { Filter, X } from 'lucide-react'

const categories = [
  'All',
  'General',
  'Work',
  'Personal',
  'Ideas',
  'Tasks',
  'Notes',
  'Projects',
]

const sortOptions = [
  { value: 'updated_desc', label: 'Recently Updated' },
  { value: 'updated_asc', label: 'Oldest Updated' },
  { value: 'created_desc', label: 'Recently Created' },
  { value: 'created_asc', label: 'Oldest Created' },
  { value: 'title_asc', label: 'Title A-Z' },
  { value: 'title_desc', label: 'Title Z-A' },
]

export function NotesFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentCategory = searchParams.get('category') || 'All'
  const currentSort = searchParams.get('sort') || 'updated_desc'
  
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (value === 'All' && key === 'category') {
      params.delete('category')
    } else {
      params.set(key, value)
    }
    
    router.push(`/notes?${params.toString()}`)
  }
  
  const clearFilters = () => {
    router.push('/notes')
  }
  
  const hasActiveFilters = currentCategory !== 'All' || currentSort !== 'updated_desc'

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <span className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Card */}
      <Card className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-medium mb-2">Category</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={currentCategory === category ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => updateFilter('category', category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Sort Options */}
          <div>
            <h3 className="text-sm font-medium mb-2">Sort by</h3>
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={currentSort === option.value ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => updateFilter('sort', option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
