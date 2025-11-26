
export type ThemeColor = string; // Now supports Hex codes directly
export type FontFamily = 'inter' | 'roboto' | 'mono';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface AgentConfig {
  id: string;
  name: string;
  greeting: string;
  systemInstruction: string;
  maxReplyTokens: number;
  knowledgeContext?: string;
  tools: string[];
  quickReplies?: string[];
  voice: {
    enabled: boolean;
    name: string;
    gender?: 'male' | 'female';
    language?: string;
    speed: number;
    pitch: number;
    phoneCallEnabled?: boolean; // Added phone call toggle
    callButtonIcon?: string; // Emoji or icon name
  };
  theme: {
    primaryColor: ThemeColor;
    chatWidgetColor?: string; // Distinct widget color
    headerColor?: string;
    headerHeight?: 'compact' | 'regular' | 'tall';
    headerTitleSize?: 'sm' | 'md' | 'lg';
    headerTitleWeight?: 'normal' | 'medium' | 'bold';
    headerBackgroundStyle?: 'solid' | 'gradient' | 'pattern';
    userBubbleColor?: string;
    userBubbleRadius?: BorderRadius;
    botBubbleColor?: string;
    botBubbleBorderColor?: string;
    botBubbleRadius?: BorderRadius;
    bubbleShadow?: boolean;
    sendButtonIcon?: 'send' | 'arrow' | 'plane' | 'sparkle';
    sendButtonStyle?: 'solid' | 'outline' | 'ghost';
    sendButtonColor?: string;
    mode: 'light' | 'dark';
    fontFamily: FontFamily;
    fontStyle: 'thin' | 'regular' | 'medium';
    fontWeight?: 'normal' | 'medium' | 'bold';
    textSize?: 'sm' | 'md' | 'lg'; // Added text size
    radius: BorderRadius;
    avatarIcon: 'sparkles' | 'bot' | 'flower' | 'user' | 'help' | 'star';
    launcherIcon?: string; // Custom launcher icon
    avatarImage?: string; // Added custom avatar image
    useLogoAsLauncher?: boolean; // Added option to use logo as launcher
    customAvatar?: string;
    headerIcon?: string; // Added header icon (emoji or url)
    chatWindowSize?: 'sm' | 'md' | 'lg' | 'custom'; // Added window size
    launcherBubbleSize?: 'sm' | 'md' | 'lg'; // Added launcher size
    scrollbarColor?: string; // Added scrollbar color
    showBranding: boolean;
    customCss?: string;
  };
}

export enum AppView {
  DASHBOARD = 'dashboard',
  BUILDER = 'builder',
  AGENTS = 'agents',
  ANALYTICS = 'analytics',
  HISTORY = 'history',
  INTEGRATION = 'integration',
  BILLING = 'billing',
  SETTINGS = 'settings',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  citations?: { title: string; url: string }[];
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  project_id: string;
  user_id?: string; // End-user ID if authenticated
  created_at: string;
  messages?: Message[];
}

export interface AnalyticsData {
  name: string;
  conversations: number;
  tokens: number;
}

export type BuilderTab = 'identity' | 'knowledge' | 'tools' | 'style' | 'voice';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  phone_number?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
}
