import React from 'react'

export default function MedicalSuppliesLayout({children}) {
    return (
        <div className='flex flex-col h-[100vh] justify-center '>
                {children}
        </div>
    )
}