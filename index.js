const fs = require('fs');
const htmlParser = require('node-html-parser');

if (process.argv.length < 3) {
  console.log("Missing file name");
  process.exit(-1);
}


const processAccountsReceivable = fileContents => {
  console.log("Starting to parse HTML");
  const root = htmlParser.parse(fileContents);
  console.log("Done parsing HTML");

  const text = root.rawText
    .replace(/&nbsp;/g, ' ')
    .replace(/\r/g, "\n")
    .replace(/\n\s*\n/g, "\n")
    .replace(/ +/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\s*Aged A\/R Detail - RPT 5\s*\n(([^\n]+)\n){20}\s*/, "")
    .replace(/\s*Aged Accounts Receivable\s*\n(([^\n]+)\n){16}\s*/g, "\n")
    .replace(/\s*\*\*\* This customer is blocked for Ship processing \*\*\*\s*/g, "\n")
    .replace(/\s*A\/P\sContact\s*\n\s*Total\sAmount\sDue/g, "\nA\/P Contact\nNone\nTotal Amount Due")
    .replace(/\s*Phone No\.\s*\n\s*A\/P Contact/g, "\nPhone No.\nNone\nA\/P Contact")
    .replace(/\s*Phone No\.\s*/g, "\n")
    .replace(/\s*Report Total Amount Due \(\$\)\s*\n(([^\n]+)\n){2,}\s*/g, "\n")
    .replace(/\s*Total Amount Due\s*/g, "\n")
    .replace(/\s*A\/P Contact\s*/g, "\n")
    .replace(/\s*$/, "");

  const lines = text.split("\n");
  const results = ['Customer Number, Name, Phone Number, A/P Contact, Credit Limit, Balance Due, Current, 31 - 60 Days, 61 - 90 Days, Over 90 Days'];
  for (let i = 0; i < lines.length;) {
    try {
      const custNum = lines[i++];
      const name = lines[i++];
      const phoneNum = lines[i++];
      const apContact = lines[i++];
      const creditLimit = lines[i++];
      const balanceDue = lines[i++];
      const current = lines[i++];
      const days1 = lines[i++];
      const days2 = lines[i++];
      const days3 = lines[i++];

      results.push(`${custNum},"${name}","${phoneNum}","${apContact}","${creditLimit}","${balanceDue}","${current}","${days1}","${days2}","${days3}"`);

      if (lines[i]) {
        while (lines[i] && (lines[i].includes('****') || !isNaN(parseFloat(lines[i].replace('%', ''))))) {
          i++;
        }
      } else {
        break;
      }
    } catch (e) {
      console.error(e);
      process.exit(-1);
    }
  }

  fs.writeFile('results.csv', results.join("\n"), (err) => {
    if (err) {
      console.error(err);
      process.exit(-1);
    };

    console.log('File saved!');
  });

  // fs.writeFile('text.txt', text, (err) => {
  //   if (err) {
  //     console.error(err);
  //     process.exit(-1);
  //   };

  //   console.log('File saved!');
  // });

  // fs.writeFile('rawText.txt', root.rawText, (err) => {
  //   if (err) {
  //     console.error(err);
  //     process.exit(-1);
  //   };

  //   console.log('File saved!');
  // });
};

const processBillDetails = fileContents => {
  console.log("Starting to parse HTML");
  const root = htmlParser.parse(fileContents.replace(/<br>/gi, '<br />').replace(/<hr>/gi, '<hr />'));
  console.log("Done parsing HTML");

  const text = root.rawText
    .replace(/&nbsp;/g, ' ')
    .replace(/\r/g, "\n")
    .replace(/\n\s*\n/g, "\n")
    .replace(/ +/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\s*Invoice History By Invoice #\s*\n(([^\n]+)\n){13}\s*/, "")
    .replace(/\s*Report Total\s*[\d,\.]+\s*\n(([^\n]+)\n){2,}\s*/g, "\n")
    .replace(/\s*$/, "");

  const lines = text.split("\n");
  const results = ['Document No.,Customer No.,Posting Date,Sales ($),Sales Tax,Invoice Total'];
  for (let i = 0; i < lines.length;) {
    try {
      const docNum = lines[i++];
      const custNum = lines[i++];
      const postDate = lines[i++];
      const sales = lines[i++];
      const salesTax = lines[i++];
      const invoiceTotal = lines[i++];

      results.push(`${docNum},${custNum},"${postDate}","${sales}","${salesTax}","${invoiceTotal}"`);
    } catch (e) {
      console.error(e);
      process.exit(-1);
    }
  }

  fs.writeFile('results.csv', results.join("\n"), (err) => {
    if (err) {
      console.error(err);
      process.exit(-1);
    };

    console.log('File saved!');
  });

  //   fs.writeFile('text.txt', text, (err) => {
  //     if (err) {
  //       console.error(err);
  //       process.exit(-1);
  //     };

  //     console.log('File saved!');
  //   });

  //   fs.writeFile('rawText.txt', root.rawText, (err) => {
  //     if (err) {
  //       console.error(err);
  //       process.exit(-1);
  //     };

  //     console.log('File saved!');
  //   });
};


const fileName = process.argv[2];
let processFunction;
if (fileName === 'Aged Account Details.htm') {
  processFunction = processAccountsReceivable;
} else if (fileName === 'Invoice History By Invoice.htm') {
  processFunction = processBillDetails;
} else {
  console.log("File name must be one of the following:");
  console.log("  Aged Account Details.htm");
  console.log("  Invoice History By Invoice.htm");
  process.exit(-1);
}

console.log("Starting to read file");
const fileContents = fs.readFileSync(fileName, 'utf8');
console.log("Done reading file.");
processFunction(fileContents);
