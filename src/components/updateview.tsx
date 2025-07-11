import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';

function Updateview() {
  const [alertmsg, setalertmsg] = useState<string>('')
  const { userProfile, loading } = useUser()

  async function getalert() {
    if (!userProfile?.organization_id) return;

    const { data, error } = await supabase
      .from('Updates')
      .select('*')
      .eq('selected', true)
      .eq("organization_id", userProfile.organization_id);
    if (error) {
      console.error('Fetch error:', error)
    } else if (data && data.length > 0) {
      setalertmsg(data[0].description)
      console.log('Fetched data:', data)
    }
  }

  useEffect(() => {
    if (!loading && userProfile) {
      getalert()
    }
  }, [loading, userProfile])

  return (
    <div className='w-full overflow-hidden bg-[#a36fd4] py-2 flex items-center'>
      <p className='text-lg font-[400] text-white animate-marquee whitespace-nowrap'>
        {alertmsg}
      </p>
    </div>
  )
}

export default Updateview

