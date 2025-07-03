"use client"

import React from 'react'
import { useMessageStore } from '@/stores/useMessageStore'

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BrainCircuit, Send } from 'lucide-react'


export const EmailWriteModal = () => {
    const { handleDraft } = useMessageStore() as {handleDraft: () => void};
    const { draftMessage, setDraftMessage } = useMessageStore() as {draftMessage: string, setDraftMessage: (draftMessage: string) => void};
    const { draftTitle, setDraftTitle } = useMessageStore() as {draftTitle: string, setDraftTitle: (draftTitle: string) => void};
  return (
    <Card>
        <CardHeader>
            <CardTitle>Write Email with AI</CardTitle>
            <CardDescription>
              Compose your email and use AI assistance to generate or improve your message.
            </CardDescription>
            {/* <CardAction>
              <Button variant="link" size="sm" className="p-0 h-auto">Learn more</Button>
            </CardAction> */}
        </CardHeader>
        <CardContent>
            <div className='flex flex-col gap-4'>
                <div>
                    <div className='text-md font-medium pb-2'>Recipient</div>
                    <Input type="text" placeholder="Enter recipient email" className='hover:border-blue-600 active:border-blue-600 focus:ring-blue-600'/>
                </div>
                <div>
                    <div className='text-md font-medium pb-2'>Title</div>
                    <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} type="text" placeholder="Enter title" className='hover:border-blue-600 focus:ring-blue-600'/>
                </div>
                <div>
                    <div className='text-md font-medium pb-2'>Message</div>
                    <textarea value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} placeholder="Enter message" className='w-full h-40 border border-input border-rounded-lg hover:border-blue-600 focus:ring-blue-600 p-2'/>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <div className='flex justify-end gap-2 w-full'>
                <Button variant="regular" onClick={handleDraft}><BrainCircuit className='w-4 h-4' /> AI</Button>
                <Button variant="outline"><Send /> Send</Button>
            </div>
        </CardFooter>
    </Card>
  )
}
