import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./CollabCreation.css";

const CollabCreation = () => {
  const [name, setName] = useState('');
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const navigate = useNavigate();

  const handleAddEmail = () => {
    if (emailInput && !emails.includes(emailInput)) {
      setEmails([...emails, emailInput]);
      setEmailInput('');
    }
  };

  const handleNext = () => {
    if (name && emails.length) {
      // Store collaboration data in Firestore here
      navigate('/collab/editor');
    }
  };

  return (
    <div className="collab-creation">
      <h1>Create Collaboration</h1>
      <div>
        <label>Collaboration Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for your collaboration"
        />
      </div>
      <div>
        <label>Invite Collaborators:</label>
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="Enter Gmail ID"
        />
        <button onClick={handleAddEmail}>Add</button>
      </div>
      <ul>
        {emails.map((email, index) => (
          <li key={index}>{email}</li>
        ))}
      </ul>
      <button onClick={handleNext}>Next</button>
    </div>
  );
};

export default CollabCreation;

