# QScan - SecureView Dashboard

![SecureView Dashboard](https://via.placeholder.com/1200x600?text=SecureView+Dashboard+Preview)

**SecureView** is a modern, interactive Application Security Posture Dashboard designed to visualize vulnerability data effectively. It provides security teams and stakeholders with a high-level overview of their security landscape, featuring dynamic charts, detailed metrics, and powerful filtering capabilities.

## 🚀 Key Features

*   **📈 Dynamic Metrics Dashboard**
    *   Real-time tracking of Total, Active, Fixed, and Critical vulnerabilities.
    *   Sparkline charts showing trend direction for each metric.
    
*   **📊 Rich Data Visualization**
    *   **Vulnerability Timeline:** Analyze vulnerability counts over time.
    *   **Severity Distribution:** Visual breakdown of vulnerabilities by severity (Critical, High, Medium, Low).
    *   **Ownership Distribution:** Radial chart visualizing vulnerability distribution across different owners.
    *   **Application Status:** Insight into the security status of various applications.
    
*   **🔍 Advanced Filtering**
    *   **Time Range Selector:** Custom date range picker with quick presets (Last 3M, 6M, 1Y, All).
    *   **Context Filters:** Filter data by "LT Owner", "Application", and "Vulnerability Status".
    *   **Global Reset:** Quickly reset all filters to the default view.

*   **📝 Interactive Data Table**
    *   Full access to raw vulnerability data.
    *   Pagination support for handling large datasets.
    *   **Customize Columns:** Toggle visibility of specific data columns to focus on what matters.

*   **🎨 Modern UI/UX**
    *   **Dark/Light Mode:** Seamless theme switching support.
    *   **Responsive Design:** Collapsible sidebar and flexible layouts for various screen sizes.
    *   **Clean Aesthetics:** Inspired by modern design systems (like Shadcn UI) for a professional look and feel.

## 🛠️ Technology Stack

*   **Core:** HTML5, CSS3 (Modern Variables & Flexbox/Grid), Vanilla JavaScript (ES6 Modules).
*   **Styling:** Custom component-based CSS architecture.
*   **Data Processing:** Client-side CSV parsing and normalization.
*   **Charting:** Custom chart wrappers (utilizing HTML5 Canvas).

## 📂 Project Structure

```text
qscan/
├── assets/
│   ├── css/               # Modular CSS files (layout, components, charts, themes)
│   ├── js/                # Core application logic
│   │   ├── charts/        # Chart component configurations
│   │   ├── app.js         # Main entry point and initialization
│   │   ├── filters.js     # Filter management logic
│   │   ├── metrics.js     # Metric calculations
│   │   └── ...
│   └── images/            # Icons and static assets
├── components/            # Reusable HTML components (e.g., sidebar)
├── data/
│   └── WIP Appsec.csv     # Data source file
├── index.html             # Main dashboard entry point
├── update_github.sh       # Utility script for Git automation
└── README.md              # Project documentation
```

## ⚡ Getting Started

### Prerequisites

*   Python 3.x (for running the local server)
*   A modern web browser (Chrome, Firefox, Edge, Safari)

### Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/asimchamp/qscan.git
    cd qscan
    ```

2.  **Start the local server:**
    You can use Python's built-in HTTP server to run the app locally.
    ```bash
    python3 -m http.server
    ```

3.  **Access the Dashboard:**
    Open your browser and navigate to:
    `http://localhost:8000`

## 📦 Maintenance

### Updating the Repository

Included is a helper script `update_github.sh` to simplify the process of staging, committing, and pushing changes to GitHub.

**Usage:**

```bash
# Make the script executable (first time only)
chmod +x update_github.sh

# Run the script
./update_github.sh
```

Follow the interactive prompts to enter your commit message and optionally create a new branch.
