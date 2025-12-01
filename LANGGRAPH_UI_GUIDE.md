# LangGraph Agent Builder - UI Guide

## Visual Layout

### Header Section
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    Create New Agent                    [❌ 2 errors]  │
│            Configure your LangGraph-powered AI agent            │
│                                                  [💾 Save Agent] │
└─────────────────────────────────────────────────────────────────┘
```

### Tab Navigation
```
┌─────────────────────────────────────────────────────────────────┐
│ [🤖 Basic] [🧠 LLM] [🔊 TTS] [🎤 STT] [💬 Speech] [📞 Call] [🛡️ Security] │
└─────────────────────────────────────────────────────────────────┘
```

## Tab Contents

### 1. Basic Tab
```
┌─────────────────────────────────────────────┐
│ 🤖 Agent Information                        │
│ ─────────────────────────────────────────── │
│                                             │
│ Agent Name *                                │
│ [My Voice Agent                          ]  │
│                                             │
│ Description                                 │
│ [Brief description...                    ]  │
│ [                                        ]  │
│                                             │
│ Language                                    │
│ [🇺🇸 English (US)                    ▼]  │
└─────────────────────────────────────────────┘
```

### 2. LLM Tab
```
┌─────────────────────────────────────────────┐
│ 🧠 LLM Configuration                        │
│ ─────────────────────────────────────────── │
│                                             │
│ Provider          Model                     │
│ [OpenAI    ▼]    [GPT-4o Mini      ▼]     │
│                                             │
│ System Prompt *                             │
│ [You are a helpful AI assistant...       ]  │
│ [                                        ]  │
│ [                                        ]  │
│ 1,234 characters                            │
│                                             │
│ Temperature: 0.7    Max Tokens: 1000        │
│ ├────●────────┤    ├────────●──────┤       │
└─────────────────────────────────────────────┘
```

### 3. TTS Tab (Text-to-Speech)
```
┌─────────────────────────────────────────────┐
│ 🔊 Text-to-Speech (TTS)                     │
│ ─────────────────────────────────────────── │
│                                             │
│ Provider          Voice                     │
│ [ElevenLabs ▼]   [Adrian (Male)     ▼]    │
│                                             │
│ Speed: 1.0x      Temperature: 1.0           │
│ ├────●────┤      ├────●────┤               │
│                                             │
│ Volume: 1.0                                 │
│ ├────●────┤                                 │
└─────────────────────────────────────────────┘
```

### 4. STT Tab (Speech-to-Text)
```
┌─────────────────────────────────────────────┐
│ 🎤 Speech-to-Text (STT)                     │
│ ─────────────────────────────────────────── │
│                                             │
│ Provider          Mode                      │
│ [Deepgram   ▼]   [Fast (Lower latency) ▼] │
│                                             │
│ Denoising                                   │
│ [Noise Cancellation                     ▼] │
│                                             │
│ Boosted Keywords                            │
│ [product] [pricing] [support] [+]           │
│ [Add keyword...                          ]  │
└─────────────────────────────────────────────┘
```

### 5. Speech Tab
```
┌─────────────────────────────────────────────┐
│ 💬 Speech Processing                        │
│ ─────────────────────────────────────────── │
│                                             │
│ Responsiveness: 1.0  Interruption: 1.0      │
│ ├────●────┤          ├────●────┤           │
│                                             │
│ Enable Backchannel              [●─────]    │
│ Agent makes acknowledgment sounds           │
│                                             │
│ Backchannel Words                           │
│ [mm-hmm] [yeah] [uh-huh] [+]               │
│                                             │
│ Normalize Speech                [●─────]    │
│ Optimize speech for clarity                 │
└─────────────────────────────────────────────┘
```

### 6. Call Tab
```
┌─────────────────────────────────────────────┐
│ 📞 Call Settings                            │
│ ─────────────────────────────────────────── │
│                                             │
│ Max Duration: 30 min  Silence: 10 min       │
│ ├────●────┤           ├────●────┤          │
│                                             │
│ Voicemail Detection             [─────●]    │
│ Detect and handle voicemail                 │
│                                             │
│ Voicemail Action                            │
│ [Leave Message                          ▼] │
│                                             │
│ Voicemail Message                           │
│ [Message to leave...                     ]  │
└─────────────────────────────────────────────┘
```

### 7. Security Tab
```
┌─────────────────────────────────────────────┐
│ 🛡️ Security & Privacy                       │
│ ─────────────────────────────────────────── │
│                                             │
│ Data Storage Policy                         │
│ [Store Everything                       ▼] │
│                                             │
│ PII Redaction                   [●─────]    │
│ Automatically redact sensitive info         │
│                                             │
│ ☑ Social Security Numbers                   │
│ ☑ Credit Card Numbers                       │
│ ☑ Phone Numbers                             │
│ ☑ Email Addresses                           │
│ ☐ Physical Addresses                        │
│ ☐ Personal Names                            │
│                                             │
│ Webhook URL                                 │
│ [https://your-webhook-url.com           ]  │
└─────────────────────────────────────────────┘
```

## Color Scheme

### Gradients
- **Background**: `from-slate-50 via-blue-50 to-indigo-50`
- **Primary Button**: `from-blue-600 to-indigo-600`
- **Tab Active**: `from-blue-600 to-indigo-600`

### Tab Icons
- **Basic**: Blue gradient (🤖 Bot)
- **LLM**: Purple-Pink gradient (🧠 Brain)
- **TTS**: Green-Emerald gradient (🔊 Volume)
- **STT**: Orange-Red gradient (🎤 Mic)
- **Speech**: Cyan-Blue gradient (💬 MessageSquare)
- **Call**: Indigo-Purple gradient (📞 Phone)
- **Security**: Red-Pink gradient (🛡️ Shield)

### Cards
- **Background**: `bg-white/80 backdrop-blur-sm`
- **Border**: `border-gray-100`
- **Shadow**: `shadow-sm`
- **Radius**: `rounded-2xl`

### Inputs
- **Border**: `border-gray-200`
- **Focus Ring**: `ring-blue-500`
- **Radius**: `rounded-xl`
- **Padding**: `px-4 py-3`

### Toggles
- **Active**: `bg-blue-600`
- **Inactive**: `bg-gray-200`
- **Knob**: `bg-white`

### Sliders
- **Track**: `bg-gray-200`
- **Thumb**: Color-coded per tab
- **Height**: `h-1.5`

## Responsive Behavior

### Desktop (>1024px)
- Full width tabs
- Side-by-side controls
- Maximum content width: 7xl

### Tablet (768px - 1024px)
- Stacked controls
- Full width inputs
- Scrollable tabs

### Mobile (<768px)
- Single column layout
- Stacked tabs (scrollable)
- Full width everything
- Touch-friendly controls

## Animations

### Page Load
- Fade in: `animate-fade-in`
- Stagger delay: `50ms` per item

### Tab Switch
- Smooth transition
- Content fade in

### Hover Effects
- Scale: `hover:scale-105`
- Shadow: `hover:shadow-xl`
- Color shift: `hover:bg-gray-50`

### Button States
- **Default**: Gradient background
- **Hover**: Darker gradient + scale
- **Active**: Scale down
- **Disabled**: Opacity 50% + no pointer

## Accessibility

### Keyboard Navigation
- Tab through all controls
- Enter to activate buttons
- Space to toggle switches
- Arrow keys for sliders

### Screen Readers
- Proper labels for all inputs
- ARIA labels for icons
- Role attributes for custom controls
- Focus indicators

### Color Contrast
- WCAG AA compliant
- Text: 4.5:1 minimum
- Interactive: 3:1 minimum

## Validation

### Visual Indicators
- **Error**: Red border + red text
- **Success**: Green checkmark
- **Warning**: Yellow triangle
- **Info**: Blue info icon

### Error Display
```
┌─────────────────────────────────────────────┐
│ ⚠️ Please fix the following errors:         │
│ • Agent name is required                    │
│ • System prompt is required                 │
│ • Voice selection is required               │
└─────────────────────────────────────────────┘
```

## Loading States

### Saving
```
[🔄 Saving...]  (spinning icon)
```

### Loading Agent
```
┌─────────────────────────────────────────────┐
│              🔄                              │
│         Loading agent...                    │
└─────────────────────────────────────────────┘
```

## Success States

### After Save
```
✅ Agent saved successfully!
```

### After Publish
```
✅ Agent published and live!
```

## Empty States

### No Keywords
```
No boosted keywords added yet.
```

### No Backchannel Words
```
No backchannel words configured.
```

## Tooltips

Hover over info icons (ℹ️) to see:
- Feature explanations
- Best practices
- Example values
- Technical details
