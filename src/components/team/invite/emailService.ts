import { db } from '../../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface SendInviteEmailParams {
  to: string;
  teamName: string;
  inviteId: string;
  invitedByName: string;
}

export const sendInviteEmail = async ({ to, teamName, inviteId, invitedByName }: SendInviteEmailParams) => {
  const MAILGUN_API_KEY = process.env.VITE_MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = process.env.VITE_MAILGUN_DOMAIN;
  
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.error('Mailgun configuration is missing');
    throw new Error('Email service configuration is incomplete');
  }

  // Check if using sandbox domain
  if (MAILGUN_DOMAIN.includes('sandbox')) {
    console.warn('Using Mailgun sandbox domain. Recipients must be verified: https://help.mailgun.com/hc/en-us/articles/217531258');
  }

  try {
    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        from: 'SynCodeX Team <noreply@syncodex.com>',
        to: to,
        subject: `You've been invited to join ${teamName} on SynCodeX`,
        template: 'team_invitation',
        'v:team_name': teamName,
        'v:invited_by': invitedByName,
        'v:invite_link': `${window.location.origin}/invite/${inviteId}`
      }).toString()
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Mailgun API Error:', responseData);
      throw new Error(`Failed to send email: ${responseData.message || 'Unknown error'}`);
    }

    // Update invite status with delivery tracking
    await updateDoc(doc(db, 'invites', inviteId), {
      emailStatus: {
        sent: true,
        sentAt: new Date().toISOString(),
        messageId: responseData.id
      }
    });

    return {
      success: true,
      messageId: responseData.id
    };
  } catch (error) {
    const err = error as Error;
    console.error('Error sending invite email:', err);
    return {
      success: false,
      emailError: err.message,
      inviteId
    };
  }
};