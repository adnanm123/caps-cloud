// Import AWS SDK
const AWS = require('aws-sdk');

// Initialize AWS SDK with your AWS credentials
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

// Create an instance of the SQS object
const sqs = new AWS.SQS();

// Define the URL of the "packages" queue
const packagesQueueUrl = process.env.PACKAGES_QUEUE_URL;

// Function to process and deliver orders
function processAndDeliverOrders() {
  const params = {
    QueueUrl: packagesQueueUrl,
    MaxNumberOfMessages: 1, // Get only one message at a time
    WaitTimeSeconds: 20, // Adjust as needed
  };

  sqs.receiveMessage(params, (err, data) => {
    if (err) {
      console.error('Error receiving message: ', err);
    } else if (data.Messages && data.Messages.length > 0) {
      const message = data.Messages[0];

      // Process the message, e.g., simulate the delivery
      console.log('Processing order:', message.Body);

      // Post a delivery notification to the vendor's specific queue
      const vendorQueueUrl = JSON.parse(message.Body).vendorUrl;
      const deliveryNotification = {
        orderId: JSON.parse(message.Body).orderId,
        status: 'Delivered',
      };

      sqs.sendMessage({
        QueueUrl: vendorQueueUrl,
        MessageBody: JSON.stringify(deliveryNotification),
      }, (deliveryErr, deliveryData) => {
        if (deliveryErr) {
          console.error('Error posting delivery notification: ', deliveryErr);
        } else {
          console.log('Delivery notification sent:', deliveryData);
        }
      });

      // Delete the processed message from the "packages" queue
      sqs.deleteMessage({
        QueueUrl: packagesQueueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }, (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting message: ', deleteErr);
        }
      });
    }

    // Continue processing orders
    processAndDeliverOrders();
  });
}

// Start processing orders
processAndDeliverOrders();
