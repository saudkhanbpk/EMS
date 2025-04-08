import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase';

function Updateview() {
    const [alertmsg,setalertmsg]=useState<string>('')
    async function getalert() {
        const { data, error } = await supabase
  .from('Updates')
  .select('*')
  .eq('selected', true);
        if (error) {
            console.error('Fetch error:', error)
        } else {
            setalertmsg(data[0].description)
            console.log('Fetched data:', data)
        }

    }
    useEffect(() => {
      
    getalert()
      
    }, [])
    
  return (
    <div className='w-full overflow-hidden bg-[#a36fd4] py-2 flex items-center'>
            <p className='text-lg font-[400] text-white animate-marquee whitespace-nowrap'>
              {alertmsg}
            </p>
          </div>
  )
}

export default Updateview  

