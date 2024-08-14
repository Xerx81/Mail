document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit form
  document.querySelector('#compose-form').onsubmit = () => send_mail();

  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show all mails according to selected mailbox
  show_mails(mailbox);
}


function send_mail() {
  
  // Get data from input fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value
  
  // Post data to backend
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
  })
  .then(() => {
    // load sent view
    load_mailbox('sent');
  })
  return false;
}


function show_mails(mailbox) {

  // Get mails from api
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Show all emails in emails-view
    emails.forEach(email => {

      // Create new div for emails-view
      const element = document.createElement('div');
      element.className = 'mail';

      // Change background color for already read mails
      if (email['read']) {
        element.style.backgroundColor = 'whitesmoke';
      }
    })

    // Add content to the new element
    element.innerHTML = `<strong>${email['sender']}</strong> ${email['subject']} <span class="timestamp">${email['timestamp']}</span>`;
    
    // Put element inside the emails-view 
    document.querySelector('#emails-view').append(element);

    element.addEventListener('click', function() {
      const id = email['id'];

      // Set read = true when clicked
      if (!email['read']) {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
      }

      // Open the clicked mail
      view_mail(id);
    });
  });
}


function view_mail(id) {

  // Clear the previous mail from mail-view
  document.querySelector('#mail-view').innerHTML = "";
  

  // Show the mail and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'block';

  // Get mail from api
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // Create new element for mail-view
    const element = document.createElement('div');

    // Replce all the \n with <br> element
    let body = email.body.replace(/\n/g, '<br>');

    // Add content to the element
    element.innerHTML = `
    <strong>From:</strong> ${email.sender}<br>
    <strong>To:</strong> ${email.recipients}<br>
    <strong>Subject:</strong> ${email.subject}<br>
    <strong>Timestamp:</strong> ${email.timestamp}<br>
    <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
    <button class="btn btn-sm btn-outline-success" id="archive">Archive</button>
    <hr>
    <p>${body}</p>`;
    
    // Add element to the mail-view
    document.querySelector('#mail-view').append(element);

    // Change name and color of archive button
    if (email.archived) {
      document.querySelector('#archive').innerHTML = 'Unarchive';
      document.querySelector('#archive').className = 'btn btn-sm btn-outline-danger';
    }

    // Archive/Unarchive email
    document.querySelector('#archive').onclick = () => archive(id, email.archived);

    // Reply to a mail
    document.querySelector('#reply').onclick = () => {
      compose_email();

      // Auto fill the composition fields
      let subject = email.subject;
      if (subject.split(' ', 1) != 'Re:'){
        subject = `Re: ${subject}`; 
      }
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    }
  })
}


function archive(id, archived) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !archived
    })
  })
  .then(() => load_mailbox('inbox'))
}