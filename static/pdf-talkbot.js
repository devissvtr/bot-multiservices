const apiKey = 'sec_YG0HJOY8CAxiBwvChAPVE3jzPgx2uA4s';

$('#uploadBtn').on('click', function () {
  const fileInput = $('#pdfFile')[0].files[0];
  if (!fileInput) {
    alert('Please select a PDF file.');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput);

  $('#loading').show();
  $('#sourceIdContainer').html('');
  $('#chatContainer').hide();

  $.ajax({
    url: 'https://api.chatpdf.com/v1/sources/add-file',
    type: 'POST',
    headers: { 'x-api-key': apiKey },
    data: formData,
    processData: false,
    contentType: false,
    success: function (response) {
      $('#loading').hide();
      $('#sourceIdContainer').html(`<p class="text-info"><strong>✅ Source ID:</strong> ${response.sourceId}</p>`);
      $('#askBtn').data('source-id', response.sourceId);
      $('#chatContainer').fadeIn();
    },
    error: function (jqXHR) {
      $('#loading').hide();
      alert('Error uploading PDF: ' + jqXHR.statusText);
    }
  });
});

$('#askBtn').on('click', function () {
  const sourceId = $(this).data('source-id');
  const question = $('#question').val().trim();

  if (!question) {
    alert('Please enter a question.');
    return;
  }

  const data = {
    sourceId: sourceId,
    messages: [
      {
        role: "user",
        content: question
      }
    ]
  };

  $('#answerContainer').html('<p class="text-warning">⏳ Getting answer...</p>');

  $.ajax({
    url: 'https://api.chatpdf.com/v1/chats/message',
    type: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify(data),
    success: function (response) {
      $('#answerContainer').html(`<div class="alert alert-info"><strong>Answer:</strong> ${response.content}</div>`);
    },
    error: function (jqXHR) {
      $('#answerContainer').html('');
      alert('Error fetching answer: ' + jqXHR.statusText);
    }
  });
});