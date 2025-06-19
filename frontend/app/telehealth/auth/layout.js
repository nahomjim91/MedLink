import React from 'react'

export default function TelehealthLayout({children}) {
    return (
        <div className='flex flex-col h-[100vh] justify-center '>
                {children}
        </div>
    )
}