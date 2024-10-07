# Crawlora SDK

The **Crawlora SDK** provides a simple and efficient way to interact with the Crawlora web crawling platform. It allows developers to manage crawlers, fetch data, and integrate crawling services into their applications using TypeScript.

## Features

- Easy integration with Crawlora's API.
- Manage and schedule crawlers programmatically.
- Fetch and process web data efficiently.
- Promise-based API for asynchronous operations.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
<!-- - [Examples](#examples) -->
- [Contributing](#contributing)
- [License](#license)

## Installation

To install the SDK, use the following command with npm:

```bash
npm install crawlora
```

## Quick Start

### Initializing the SDK

To use the SDK, import it into your project and initialize it with your **API Key**:

```typescript
import { Crawlora } from 'crawlora';

const client = new Crawlora({
    apiKey: 'YOUR_API_KEY',
});
```

### Creating and Running a Crawler

```typescript
client.createCrawler({
  name: 'example-crawler',
  startUrl: 'https://example.com',
  callbackUrl: 'https://yourapp.com/callback',
}).then(crawler => {
  console.log(`Crawler created: ${crawler.id}`);
}).catch(error => {
  console.error('Error creating crawler:', error);
});
```

### Fetching Data

Once a crawler has completed its run, you can fetch the data:

```typescript
client.getCrawlData('crawler-id')
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error('Error fetching crawl data:', error);
  });
```

## API Reference

### `createCrawler(options): Promise<Crawler>`

- **options**: Object containing crawler settings.
  - `name`: Crawler name.
  - `startUrl`: The URL to start crawling.
  - `callbackUrl`: URL to receive the crawled data.
- **Returns**: A promise that resolves to the created `Crawler` object.

### `getCrawlData(crawlerId: string): Promise<any>`

- **crawlerId**: The ID of the crawler whose data you want to retrieve.
- **Returns**: A promise that resolves to the crawled data.

## Configuration

You can configure the SDK using environment variables or directly within your application.

### Environment Variables

- `CRAWLORA_API_KEY`: Your API Key for authentication.

### Direct Configuration

Pass options during initialization:

```typescript
const client = new Crawlora({
    apiKey: 'YOUR_API_KEY',
    timeout: 5000, // Timeout for API requests
});
```

## Error Handling

The SDK provides built-in error handling for network issues, API rate limits, and other common errors. Example:

```typescript
client.getCrawlData('crawler-id')
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error('Error fetching crawl data:', error);
  });
```

<!-- ## Examples

See the [examples](examples) directory for more detailed usage and integration examples. -->

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get involved.

## License

This SDK is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.