# PhoneLink Component Guide

## 📋 Overview

The `PhoneLink.tsx` component makes phone numbers clickable with the `tel:` protocol, allowing users to dial directly from mobile devices or open their phone app on desktop.

---

## 🚀 Installation

1. **Create file in Framer:**
   - Code tab → New File → `PhoneLink.tsx`
   - Copy code from `PhoneLink.tsx`

2. **Add to CMS pages:**
   - Add the `PhoneLink` component to your listing pages
   - Connect to CMS field: `phone`

---

## 🔗 How It Works

The component:
1. Takes a phone number from your CMS
2. Cleans it (removes spaces, dashes, parentheses)
3. Wraps it in a `tel:` link
4. Makes it clickable on all devices

**On Mobile:** Opens dialer with number pre-filled  
**On Desktop:** Opens phone app if available (Skype, FaceTime, etc.)

---

## 📝 Usage

### Method 1: Connect to CMS Field (Recommended)

1. **Add component to listing page**
2. **Connect properties:**
   - `phone` → Connect to CMS field: `phone`
   - `displayText` → Leave empty (uses phone number) or customize

3. **Done!** Phone numbers are now clickable

### Method 2: Manual Entry

1. **Add component to page**
2. **Set properties manually:**
   - Phone: `(434) 555-1234`
   - Display Text: `Call Us` (optional)

---

## 🎨 Customization

### Properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `phone` | String | `""` | Phone number from CMS |
| `displayText` | String | `""` | Custom text (uses phone if empty) |
| `showIcon` | Boolean | `true` | Show/hide phone icon |
| `textColor` | Color | `#2d6a4f` | Text and icon color |
| `fontSize` | Number | `14` | Font size in pixels |
| `fontWeight` | Enum | `400` | Light, Regular, Medium, Semi Bold, Bold |
| `underline` | Boolean | `false` | Show/hide underline |

---

## 📍 Examples

### Example 1: Basic Phone Link
```
Phone: (434) 555-1234
Display Text: (empty)

Output: 📞 (434) 555-1234 (clickable)
```

### Example 2: Custom Display Text
```
Phone: (434) 555-1234
Display Text: Call Us

Output: 📞 Call Us (clickable, dials 4345551234)
```

### Example 3: No Icon
```
Phone: (434) 555-1234
Show Icon: false

Output: (434) 555-1234 (clickable, no icon)
```

---

## 🔧 How tel: Links Work

### Format:
- `tel:+14345551234` (with country code)
- `tel:4345551234` (local number)

### What Happens:
- **Mobile:** Opens phone dialer with number ready to call
- **Desktop:** Opens default phone app (Skype, FaceTime, etc.)
- **Tablet:** Same as mobile

### Phone Number Cleaning:
The component automatically:
- Removes spaces: `(434) 555-1234` → `4345551234`
- Removes dashes: `434-555-1234` → `4345551234`
- Removes parentheses: `(434) 555-1234` → `4345551234`
- Keeps `+` for international: `+1 434-555-1234` → `+14345551234`

---

## 💡 Best Practices

1. **Use CMS Field:** Connect to your `phone` field for automatic updates
2. **Keep Formatting:** Display text can have formatting, tel: link uses cleaned number
3. **Mobile First:** Test on mobile devices to ensure dialer opens correctly
4. **Accessibility:** Icon helps users understand it's clickable

---

## 🎯 Integration with CMS

The component works seamlessly with Framer CMS:

1. **Add to listing pages:**
   - Place near address or contact info
   - Connect to `phone` field

2. **Styling:**
   - Match your site's link colors
   - Adjust font size to match surrounding text

3. **Multiple Formats:**
   - Works with any phone format: `(434) 555-1234`, `434-555-1234`, `434.555.1234`
   - Automatically cleans for tel: link

---

## 🐛 Troubleshooting

**Phone link not working:**
- Check that phone number is not empty
- Verify tel: link format (should be `tel:4345551234`)
- Test on mobile device (desktop may not have phone app)

**Icon not showing:**
- Check `showIcon` is set to `true`
- Verify `fontSize` is large enough to see icon

**Wrong number dialing:**
- Check phone number format in CMS
- Component cleans number automatically, but verify source data

---

## ✅ Quick Setup Checklist

- [ ] Created `PhoneLink.tsx` file in Framer
- [ ] Added component to listing pages
- [ ] Connected to CMS field (`phone`)
- [ ] Tested on mobile device
- [ ] Customized colors/styling to match site

---

## 🎨 Styling Tips

- **Match site colors:** Use your brand color for `textColor`
- **Consistent sizing:** Match `fontSize` to surrounding text
- **Icon size:** Icon automatically scales with `fontSize`
- **Hover effect:** Built-in opacity change on hover

---

## ✅ That's It!

The PhoneLink component is ready to use. Just connect it to your CMS `phone` field and phone numbers will be clickable on all devices!

