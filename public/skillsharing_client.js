const talkDiv = document.querySelector('#talks');
const nameField = document.querySelector('#name');
const talkForm = document.querySelector('#newtalk');
nameField.value = localStorage.getItem('name') || '';
let lastServerTime = 0;
let shownTalks = Object.create(null);


const request = (options, callback) => {
  let req = new XMLHttpRequest();
  req.open(options.method || 'GET', options.pathname, true);
  req.addEventListener('load', () => {
    req.status < 400 ? callback(null, req.responseText) :
    callback(new Error('Request failed: ' + req.statusText));
  });
  req.addEventListener('error', () => {
    callback(new Error('Network error'));
  });
  req.send(options.body || null);
};

const reportError = (error) => {
  if (error) {
    alert(error.toString());
  };
};


const instantiateTemplate = (name, values) => {
  const instantiateText = (text) => {
    return text.replace(/\{\{(\w+)\}\}/g, function(_, name) {
      return values[name];
    });
  }
  const instantiate = (node) => {
    if (node.nodeType == document.ELEMENT_NODE) {
      let copy = node.cloneNode();
      for (let i = 0; i < node.childNodes.length; i++)
        copy.appendChild(instantiate(node.childNodes[i]));
      return copy;
    } else if (node.nodeType == document.TEXT_NODE) {
      return document.createTextNode(
        instantiateText(node.nodeValue));
    } else {
      return node;
    }
  }

  let template = document.querySelector('#template .' + name);
  return instantiate(template);
}

const drawTalk = (talk) => {
  const node = instantiateTemplate('talk', talk);
  const comments = node.querySelector('.comments');
  talk.comments.forEach(function(comment) {
    comments.appendChild(
      instantiateTemplate('comment', comment));
  });

  node.querySelector('button.del').addEventListener(
    'click', deleteTalk.bind(null, talk.title));

  const form = node.querySelector('form');
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    addComment(talk.title, form.elements.comment.value);
    form.reset();
  });
  return node;
};

const displayTalks = (talks) => {
  talks.forEach(function(talk) {
    let shown = shownTalks[talk.title];
    if (talk.deleted) {
      if (shown) {
        talkDiv.removeChild(shown);
        delete shownTalks[talk.title];
      }
    } else {
      let node = drawTalk(talk);
      if (shown)
      talkDiv.replaceChild(node, shown);
      else
      talkDiv.appendChild(node);
      shownTalks[talk.title] = node;
    }
  });
};
const talkURL = (title) => {
  return 'talks/' + encodeURIComponent(title);
};

const deleteTalk = (title) => {
  request({pathname: talkURL(title), method: 'DELETE'},
    reportError);
};

const addComment = (title, comment) => {
  let commentObj = {
    author: nameField.value,
    message: comment,
  };
  request({
    pathname: talkURL(title) + '/comments',
    body: JSON.stringify(commentObj),
    method: 'POST',
  },
    reportError);
};

const waitForChanges = () => {
  request({pathname: 'talks?changesSince=' + lastServerTime},
    (error, response) => {
      if (error) {
        setTimeout(waitForChanges, 2500);
        console.error(error.stack);
      } else {
        response = JSON.parse(response);
        displayTalks(response.talks);
        lastServerTime = response.serverTime;
        waitForChanges();
      }
    });
}

nameField.addEventListener('change', function() {
  localStorage.setItem('name', nameField.value);
});

talkForm.addEventListener('submit', function(event) {
  event.preventDefault();
  request({
    pathname: talkURL(talkForm.elements.title.value),
    method: 'PUT',
    body: JSON.stringify({
      presenter: nameField.value,
      summary: talkForm.elements.summary.value
    })
  }, reportError);
  talkForm.reset();
});

request({pathname: 'talks'}, (error, response) => {
  if (error) {
    reportError(error);
  } else {
    response = JSON.parse(response);
    displayTalks(response.talks);
    lastServerTime = response.serverTime;
    waitForChanges();
  }
});
