// Create web server

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Create object to store comments
const commentsByPostId = {};

// Route handler for GET request
app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

// Route handler for POST request
app.post('/posts/:id/comments', async (req, res) => {
    const comment = req.body;
    const postId = req.params.id;
    const comments = commentsByPostId[postId] || [];

    // Add new comment to array
    comments.push(comment);
    commentsByPostId[postId] = comments;

    // Emit event to event bus
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: comment.id,
            postId,
            content: comment.content,
            status: comment.status
        }
    });

    res.status(201).send(comments);
});

// Route handler for POST request
app.post('/events', async (req, res) => {
    console.log('Event Received:', req.body.type);

    const { type, data } = req.body;

    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;
        const comments = commentsByPostId[postId];

        // Find comment to update
        const comment = comments.find(comment => {
            return comment.id === id;
        });

        // Update comment
        comment.status = status;

        // Emit event to event bus
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                postId,
                status,
                content
            }
        });
    }

    res.send({});
});

// Listen for requests
app.listen(4001, () => {
    console.log('Listening on 4001');
});