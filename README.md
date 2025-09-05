# Delicatessen Production Planner - Web Application

A professional, modern web application for intelligent batch production planning in delicatessen operations. This application transforms CSV sales data into optimized production plans using advanced forecasting algorithms, multi-day batch optimization, and intelligent holiday/seasonal adjustments.

## Overview

This web application provides:
- **Multi-Year Data Analysis**: Upload multiple CSV files to analyze sales trends across years
- **Intelligent Holiday Detection**: Robust holiday awareness system that works for any year
- **Batch Production Optimization**: Multi-day lookahead planning with configurable batch sizes
- **Interactive Item Selection**: Filter and select items based on sales volume and importance
- **Professional Export**: Generate XLSX files and Google Sheets for daily production plans
- **Modern UI**: Clean, professional interface optimized for production managers

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Headless UI
- **Data Processing**: Web Workers for CSV parsing and calculations
- **Charts**: Chart.js for sales trend visualization
- **Export**: SheetJS (XLSX) + Google Sheets API
- **Deployment**: GitHub Pages (static hosting)

### Key Features
1. **CSV Data Management**
   - Drag & drop CSV upload with validation
   - Multi-file support for historical data comparison
   - Automatic fiscal calendar conversion
   - Data preview and validation

2. **Intelligent Forecasting**
   - Holiday proximity analysis with configurable impact zones
   - Day-of-week pattern recognition
   - Seasonal variation adjustments
   - Multi-year trend analysis

3. **Batch Production Planning**
   - Configurable minimum batch sizes
   - Multi-day demand forecasting
   - Shelf life constraint optimization
   - FIFO inventory management

4. **Professional Output**
   - Clean, printable production plans
   - XLSX export with formatting
   - Google Sheets integration
   - Customizable templates

## Project Structure

```
rewrite/
├── public/                     # Static assets
├── src/
│   ├── components/            # React components
│   │   ├── common/           # Reusable UI components
│   │   ├── csv/              # CSV upload and management
│   │   ├── planning/         # Production planning interface
│   │   └── export/           # Export functionality
│   ├── lib/                  # Core business logic
│   │   ├── csv-parser.ts     # CSV parsing and validation
│   │   ├── forecasting.ts    # Demand forecasting algorithms
│   │   ├── batch-optimizer.ts # Batch size optimization
│   │   ├── holiday-engine.ts  # Holiday detection and impact
│   │   └── export-engine.ts   # Export functionality
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── workers/              # Web Workers for heavy processing
├── docs/                     # Documentation
├── tests/                    # Test files
└── config files             # Vite, TypeScript, Tailwind configs
```

## Getting Started

### Prerequisites
- Node.js 18+
- Modern web browser
- (Optional) Google API credentials for Sheets integration

### Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

## Usage Workflow

1. **Upload CSV Files**: Drag and drop historical sales data files
2. **Configure Settings**: Set up holidays, batch sizes, and forecasting parameters
3. **Select Date Range**: Choose the planning period from available data
4. **Filter Items**: Select which products to include in the production plan
5. **Generate Plan**: Create optimized batch production schedule
6. **Export**: Download XLSX file or save to Google Sheets
7. **Print**: Use generated plan for daily production operations

## Data Format

The application expects CSV files with the following columns:
- Dept Num, Fiscal Year, Member Net Sales Amt, Member Net Sales Amt LY
- Major Group Cat Code, Member Net Sales Units, Member Net Sales Units LY
- Item (format: "12345 ITEM DESCRIPTION"), Fiscal Period, Fiscal Week, Fiscal Day

## Features

### Intelligent Forecasting
- Automatically detects holidays and their impact on sales
- Learns day-of-week patterns from historical data
- Applies seasonal adjustments based on month and weather patterns
- Compares multiple years to identify trends

### Batch Optimization
- Calculates optimal batch sizes to minimize setup costs
- Ensures production doesn't exceed shelf life constraints
- Balances efficiency gains against waste risk
- Provides clear explanations for all production decisions

### Professional Interface
- Clean, modern design suitable for business use
- Responsive layout works on desktop and tablet
- Intuitive workflow with clear progress indicators
- Professional typography and color scheme

### Export Capabilities
- High-quality XLSX files with proper formatting
- Google Sheets integration with real-time collaboration
- Printable layouts optimized for production floor use
- Customizable templates for different operational needs

## Configuration

### Holiday Configuration
The system includes comprehensive holiday databases for multiple countries and can be extended with custom holidays. Each holiday can have:
- Configurable impact zones (days before/after)
- Sales multipliers (increase/decrease factors)
- Year-specific date handling

### Batch Settings
Each item can be configured with:
- Minimum efficient batch size
- Maximum lookahead days
- Shelf life constraints
- Production capacity limits

### Forecasting Parameters
- Base growth rates
- Seasonal adjustment factors
- Day-of-week multipliers
- Holiday impact weights

## License

MIT License - See LICENSE file for details

## Support

For technical support or feature requests, please open an issue in the GitHub repository.


