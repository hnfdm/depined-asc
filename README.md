## Depined Auto Connect

A Node.js application to automatically maintain connections with the Depined platform and track earnings.

### Features

- Automatic connection maintenance
- Real-time earnings tracking
- Multi-account support
- Epoch tracking
- Beautiful console output with colors
- Detailed logging system

### Registration

Before using this tool, you need to register on the Depined platform:

1. Visit [Depined Platform](https://app.depined.org/onboarding)
2. Use the following referral code during registration:

```
scbPAKiN7Ntw
```

**Important Note**: This referral code has a usage limit of 1 people. If you're unable to use it, it means the maximum limit has been reached.

### Configuration

1. Edit `data.txt` & `proxies.txt`
2. Add your JWT tokens to `data.txt`, one per line:

```
your_jwt_token_1
your_jwt_token_2
...
```

3. Add your Proxy to `proxies.txt`, one per line:

```
https://username:pass@ip:port
http://username:pass@ip:port
...
```

4. Install Module

```
npm i
```

5. Run Script

```
node main.js
```

### Output Format

The application displays information in the following format:

```
[Username] Connected | Earnings: xx.xx (Epoch: X) | Proxy: xx.xx.xx.xx
```

Where:

- Earnings are formatted in K (thousands), M (millions), or B (billions)
- Epoch shows the current epoch number

### Disclaimer

1. Feel free to submit issues, create pull requests, or fork the repository
2. This tool is for educational purposes only. Use it responsibly and in accordance with Depined's terms of service.

### Support

For support, you can reach out through:

- GitHub: https://github.com/zamzasalim
- Telegram: https://t.me/airdropasc

### License

MIT License - feel free to use and modify for your own purposes.
