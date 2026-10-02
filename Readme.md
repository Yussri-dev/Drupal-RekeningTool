# Drupal RekeningTool – Feed Value Price Calculator

A web-based calculation tool for calculating and comparing the **feed value price of cattle feed products**. The application is designed for use within the Drupal environment of Rundveeloket.

## Live Website

**View the tool:**  
https://rundveeloket.be/tools/voederwaardeprijs

## About the Project

The calculator combines feed value prices with nutritional data to determine a current or average feed value price for different feed products.

Users can:

- select a recent date or period;
- choose one or more feed products;
- calculate **VWP Milk**;
- calculate **VWP Meat**;
- enter an actual market price;
- compare the market price with the calculated feed value price;
- view the price difference as a percentage.

## Project Structure

```text
Drupal-RekeningTool/
├── Styles/
├── assets/
├── dist/
├── scripts/
├── CVB-Table.xlsx
├── footer-drupal.html.twig
├── index.html
├── index.js
├── package.json
├── package-lock.json
├── wur_data_clean.json
└── exe.json
```

## Technologies

- JavaScript
- HTML
- CSS
- Node.js / npm
- Drupal / Twig integration
- JSON data
- Excel data

## Installation

Clone the repository:

```bash
git clone https://github.com/Yussri-dev/Drupal-RekeningTool.git
cd Drupal-RekeningTool
```

Install the dependencies:

```bash
npm install
```

Start the project using the script configured in `package.json`:

```bash
npm start
```

> Check `package.json` if the project uses a different start or build script.

## Data Sources

The project contains data files such as:

- `CVB-Table.xlsx`
- `wur_data_clean.json`

These files support the calculations and provide the feed product data used by the tool.

## Drupal Integration

The repository contains files such as `footer-drupal.html.twig`, which can be used to integrate the calculator into a Drupal theme or Drupal page.

## Production

The public version of the calculator is available on Rundveeloket:

https://rundveeloket.be/tools/voederwaardeprijs

## Repository

GitHub:

https://github.com/Yussri-dev/Drupal-RekeningTool

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
