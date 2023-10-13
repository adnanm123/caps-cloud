// Import AWS SDK
const AWS = require('aws-sdk');

// Initialize AWS SDK with your AWS credentials
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

// Create an instance of the SNS and SQS objects
const sns = new AWS.SNS();
const sqs = new AWS.SQS();

// Define the vendor-specific queue URL
const vendorQueueUrl = process.env.VENDOR_QUEUE_URL;

// Simulate sending a pickup message to the "pickup" topic
function sendPickupMessage() {
  const params = {
    Message: JSON.stringify({
      orderId: Math.floor(Math.random() * 1000),
      customer: 'VendorXQueue',
      vendorUrl: vendorQueueUrl,
    }),
    TopicArn: process.env.PICKUP_TOPIC_ARN,
  };

  sns.publish(params, (err, data) => {
    if (err) {
      console.error('Error publishing message: ', err);
    } else {
      console.log('Message sent:', data);
    }
  });
}

// Periodically send pickup messages
setInterval(sendPickupMessage, 5000); // Adjust the interval as needed

// Poll the vendor-specific queue for delivery notifications
function pollVendorQueue() {
  const params = {
    QueueUrl: vendorQueueUrl,
    AttributeNames: ['All'],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: ['All'],
    VisibilityTimeout: 20, // Adjust as needed
    WaitTimeSeconds: 10,
  };

  sqs.receiveMessage(params, (err, data) => {
    if (err) {
      console.error('Error receiving message: ', err);
    } else if (data.Messages) {
      data.Messages.forEach((message) => {
        console.log('Received message:', message.Body);
        // Process the message as needed
      });
    }
  });
}

// Start polling the queue
pollVendorQueue();
