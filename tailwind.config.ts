
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#000000',
					foreground: '#ffffff'
				},
				secondary: {
					DEFAULT: '#f8f8f8',
					foreground: '#1a1a1a'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: '#f8f8f8',
					foreground: '#666666'
				},
				accent: {
					DEFAULT: '#4a90e2',
					foreground: '#ffffff'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: '#ffffff',
					foreground: '#000000'
				},
				charcoal: '#1a1a1a',
				'dark-gray': '#333333',
				'medium-gray': '#666666',
				'light-gray': '#cccccc',
				'off-white': '#f8f8f8',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				'hero': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
				'section': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
				'subsection': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
				'card-title': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
				'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
				'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
				'body-sm': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
				'caption': ['12px', { lineHeight: '1.3', fontWeight: '500', letterSpacing: '0.5px' }],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'card': '0 2px 4px rgba(0,0,0,0.1)',
				'card-hover': '0 4px 12px rgba(0,0,0,0.15)',
				'header': '0 1px 3px rgba(0,0,0,0.1)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
