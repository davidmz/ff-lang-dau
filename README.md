# The DAU-by-language calculator for FreeFeed.net

## Usage

Use Node.js 14+. Install dependencies by running `yarn install`.

1. Update the `config.js` file: set the database connection options, language
   code and other parameters.

2. Execute the `node find-users.js` command. It will check all FreeFeed users
   for the desired language and save their UID's to the file in the _results_
   folder.

3. Execute the `node calc-dau.js` command. It will collect the previously
   selected users activity and save it to the _results_ folder as CSV file. The
   result file has two column: date (YYYY-DD-MM) and the number of active users.
