"use client"

import React, { useState } from 'react'
import { useMessageStore } from '@/stores/useMessageStore'
import TextareaAutosize from 'react-textarea-autosize';

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
import { useUser } from '@clerk/nextjs'
import { Loader } from '@/components/ui/loader'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const EmailWriteModal = () => {
    const { handleDraft } = useMessageStore() as {handleDraft: () => void};
    const { draftMessage, setDraftMessage } = useMessageStore() as {draftMessage: string, setDraftMessage: (draftMessage: string) => void};
    const { draftSubject, setDraftSubject } = useMessageStore() as {draftSubject: string, setDraftSubject: (draftSubject: string) => void};
    const { recipient, setRecipient } = useMessageStore() as {recipient: string, setRecipient: (recipient: string) => void};

    const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSend = async () => {
        if (!recipient || !draftSubject || !draftMessage) {
            setError('All fields are required.');
            setSuccess(null);
            return;
        }
        if (!isValidEmail(recipient)) {
            setError('Please enter a valid email address.');
            setSuccess(null);
            return;
        }
        setError(null);
        setLoading(true);
        const response = await fetch('/api/send', {
            method: 'POST',
            body: JSON.stringify({
                recipient,
                subject: draftSubject,
                content: draftMessage,
                sender: user?.emailAddresses[0].emailAddress
            })
        })
        if (response.ok) {
            setLoading(false);
            setDraftMessage('');
            setDraftSubject('');
            setRecipient(''); 
            setError(null);
            setSuccess('Sent successfully!');
            setTimeout(() => setSuccess(null), 3000);
            console.log('Email sent successfully');
        } else {
            setLoading(false);
            setError('Failed to send email');
            setSuccess(null);
            console.error('Failed to send email');
        }
    }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Write Email with AI</CardTitle>
            <CardDescription>
              Compose your email and use AI assistance to generate or improve your message.
            </CardDescription>
        </CardHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
        <CardContent>
            <div className='flex flex-col gap-4'>
                <div>
                    <div className='text-md font-medium pb-2'>Recipient</div>
                    <Input type="email" required disabled={loading} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Enter recipient email" className='hover:border-blue-600 active:border-blue-600 focus:ring-blue-600'/>
                </div>
                <div>
                    <div className='text-md font-medium pb-2'>Subject</div>
                    <Input disabled={loading} required value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} type="text" placeholder="Enter subject" className='hover:border-blue-600 focus:ring-blue-600'/>
                </div>
                <div>
                    <div className='text-md font-medium pb-2'>Message</div>
                    <TextareaAutosize disabled={loading} required value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} placeholder="Enter message" className='w-full h-40 border border-input border-rounded-lg hover:border-blue-600 focus:ring-blue-600 p-2'/>
                </div>
                {error && <div className="text-red-500 text-sm pt-1">{error}</div>}
                {success && <div className="text-green-600 text-sm pt-1">{success}</div>}
            </div>
        </CardContent>
        <CardFooter>
            <div className='flex justify-end gap-2 w-full'>
                <Button type="button" variant="regular" onClick={handleDraft} disabled={loading}><BrainCircuit className='w-4 h-4' /> AI</Button>
                <Button type="submit" variant="outline" disabled={loading}><Send /> {loading ? <Loader loadingText="" additionalStyles="w-4 h-4" /> : 'Send'}</Button>
            </div>
        </CardFooter>
        <div className="w-full text-right pr-6 pb-2">
          <span className="text-xs text-gray-400">Powered by <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">Resend</a></span>
        </div>
        </form>
    </Card>
  )
}
