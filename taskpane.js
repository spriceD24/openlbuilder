Office.onReady((info) => {
    if (info.host === Office.HostType.Excel) {
        console.log('Office JS Ready');
        initializeWizard();
    }
});

let currentStep = 1;
let tableConfig = {};

function initializeWizard() {
    const tableTypeSelect = document.getElementById('tableType');
    if (tableTypeSelect) {
        tableTypeSelect.addEventListener('change', updateFormFields);
        console.log('Wizard initialized');
    } else {
        console.error('Table type select not found');
    }
    
    const step2Content = document.querySelector('#step2 .input-group');
    if (step2Content) {
        step2Content.innerHTML = `
            <label for="tableName">Table Name</label>
            <input type="text" id="tableName" required>
            <label for="rowCount">Number of Rows</label>
            <input type="number" id="rowCount" min="1" value="1" required>
        `;
    }

    setupButtonListeners();
}

function setupButtonListeners() {
    const nextButton = document.querySelector('#step1 .button-group button');
    if (nextButton) {
        nextButton.addEventListener('click', () => nextStep(1));
    }

    const backButton = document.querySelector('#step2 .button-group button:first-child');
    if (backButton) {
        backButton.addEventListener('click', () => previousStep(2));
    }

    const createButton = document.querySelector('#step2 .button-group button:last-child');
    if (createButton) {
        createButton.addEventListener('click', createTable);
    }
}

function updateFormFields() {
    const tableType = document.getElementById('tableType').value;
    tableConfig.type = tableType;
    
    const returnTypeSection = document.getElementById('returnTypeSection');
    const parametersSection = document.getElementById('parametersSection');
    const rowCountLabel = document.querySelector('label[for="rowCount"]');
    
    // Update row count label based on table type
    if (rowCountLabel) {
        if (tableType === 'datatype') {
            rowCountLabel.textContent = 'Number of Fields';
        } else if (tableType === 'spreadsheet') {
            rowCountLabel.textContent = 'Number of Steps';
        } else {
            rowCountLabel.textContent = 'Number of Rows';
        }
    }
    
    // Show/hide sections based on table type
    if (returnTypeSection && parametersSection) {
        returnTypeSection.style.display = 'none';
        parametersSection.style.display = 'none';

        switch(tableType) {
            case 'spreadsheet':
                parametersSection.style.display = 'block';
                break;
            case 'rules':
            case 'lookup':
                parametersSection.style.display = 'block';
                returnTypeSection.style.display = 'block';
                break;
        }
    }
}

function addParameter() {
    const parametersContainer = document.getElementById('parameters');
    const newRow = document.createElement('div');
    newRow.className = 'parameter-row';
    newRow.innerHTML = `
        <select class="parameter-type">
            <option value="">Select Type...</option>
            <option value="Integer">Integer</option>
            <option value="Boolean">Boolean</option>
            <option value="Date">Date</option>
            <option value="String">String</option>
        </select>
        <input type="text" class="parameter-input" placeholder="Parameter name">
        <button class="remove-parameter-btn" onclick="removeParameter(this)">×</button>
    `;
    parametersContainer.appendChild(newRow);
}

function removeParameter(button) {
    button.parentElement.remove();
}

function getParameters() {
    const parameters = [];
    document.querySelectorAll('.parameter-row').forEach(row => {
        const type = row.querySelector('.parameter-type').value;
        const name = row.querySelector('.parameter-input').value.trim();
        if (type && name) {
            parameters.push({ type, name });
        }
    });
    return parameters;
}

// Format parameters for spreadsheet header
function formatParameterList(parameters) {
    if (parameters.length === 0) return '';
    const paramString = parameters
        .map(p => `${p.type} ${p.name}`)
        .join(', ');
    return `(${paramString})`;
}

function nextStep(stepNum) {
    if (!validateStep(stepNum)) {
        showErrorMessage('Please fill in all required fields correctly.');
        return;
    }

    document.querySelector(`#step${stepNum}`).classList.remove('active');
    document.querySelector(`#step${stepNum + 1}`).classList.add('active');
    currentStep = stepNum + 1;
}

function previousStep(currentStepNum) {
    document.querySelector(`#step${currentStepNum}`).classList.remove('active');
    document.querySelector(`#step${currentStepNum - 1}`).classList.add('active');
    currentStep = currentStepNum - 1;
}

function validateStep(step) {
    switch(step) {
        case 1:
            return document.getElementById('tableType').value !== '';
        case 2:
            const tableName = document.getElementById('tableName').value;
            const rowCount = document.getElementById('rowCount').value;
            return tableName !== '' && 
                   /^[A-Za-z][A-Za-z0-9]*$/.test(tableName) && 
                   rowCount && parseInt(rowCount) > 0;
        default:
            return true;
    }
}

function showSuccessMessage() {
    // Hide current step
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show success page
    const successPage = document.getElementById('successPage');
    if (successPage) {
        successPage.classList.add('active');
    }
}

function showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = 'Error: ' + message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}

function backToMenu() {
    // Reset all fields
    document.getElementById('tableType').value = '';
    document.getElementById('tableName').value = '';
    document.getElementById('rowCount').value = '1';
    const parametersContainer = document.getElementById('parameters');
    if (parametersContainer) {
        parametersContainer.innerHTML = '';
    }
    
    // Hide all steps and show first step
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step1').classList.add('active');
}

async function createDatatypeTable(context, sheet, startRow, tableName) {
    try {
        console.log(`Creating datatype table "${tableName}" at row ${startRow}`);
        
        const rowCount = parseInt(document.getElementById('rowCount').value);
        if (rowCount < 1) {
            throw new Error('Row count must be greater than 0');
        }

        // Create and format header
        const headerRange = sheet.getRange(`B${startRow}:D${startRow}`);
        headerRange.values = [[`Datatype ${tableName}`, "", ""]];
        headerRange.merge();
        await context.sync();

        // Apply header formatting
        headerRange.format.font.name = "Franklin Gothic Book";
        headerRange.format.font.size = 10;
        headerRange.format.font.color = "#A5A5A5";
        headerRange.format.fill.color = "white";
        headerRange.format.horizontalAlignment = "Center";

        // Set header borders
        headerRange.format.borders.getItem('EdgeTop').style = 'Continuous';
        //headerRange.format.borders.getItem('EdgeTop').weight = 2;
        headerRange.format.borders.getItem('EdgeBottom').style = 'Continuous';
        //headerRange.format.borders.getItem('EdgeBottom').weight = 2;
        headerRange.format.borders.getItem('EdgeLeft').style = 'None';
        headerRange.format.borders.getItem('EdgeRight').style = 'None';

        await context.sync();

        // Create body rows
        for (let i = 0; i < rowCount; i++) {
            const currentRow = startRow + i + 1;
            const isLastRow = i === rowCount - 1;
            const isFirstRow = i === 0;
            
            // Create ranges for all three columns
            const columns = {
                B: sheet.getRange(`B${currentRow}`),
                C: sheet.getRange(`C${currentRow}`),
                D: sheet.getRange(`D${currentRow}`)
            };

            // Format all columns
            Object.values(columns).forEach(column => {
                column.format.font.name = "Franklin Gothic Book";
                column.format.font.size = 10;
                column.format.font.color = "#A5A5A5";
                column.format.fill.color = "white";
                column.format.horizontalAlignment = "Left";
                
                // Clear borders
                ['EdgeTop', 'EdgeBottom', 'EdgeLeft', 'EdgeRight'].forEach(edge => {
                    column.format.borders.getItem(edge).style = 'None';
                });
            });

            // Middle column special formatting
            columns.C.format.fill.color = "#DCE6F1";

            // Last row border
            if (isLastRow) {
                Object.values(columns).forEach(column => {
                    column.format.borders.getItem('EdgeBottom').style = 'Continuous';
                    //column.format.borders.getItem('EdgeBottom').weight = 2;
                });
            }
            if(isFirstRow){
                Object.values(columns).forEach(column => {
                    column.format.borders.getItem('EdgeTop').style = 'Continuous';
                    //column.format.borders.getItem('EdgeTop').weight = 2;
                });
            }
        }

        await context.sync();
        console.log('Datatype table created successfully');
        
        // Show success page after table is created
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        
        const successPage = document.getElementById('successPage');
        if (successPage) {
            successPage.classList.add('active');
        } else {
            console.error('Success page not found');
        }
    } catch (error) {
        console.error('Error creating datatype table:', error);
        throw error;
    }
}

// And make sure your createTable function includes proper success handling:
async function createTable() {
    console.log('Creating table...');
    try {
        await Excel.run(async (context) => {
            const sheet = context.workbook.worksheets.getActiveWorksheet();
            const tableType = document.getElementById('tableType').value;
            const tableName = document.getElementById('tableName').value;

            let startRow = 2;
            const usedRange = sheet.getUsedRange();
            usedRange.load("address, rowCount, isEmpty");
            await context.sync();

            if (!usedRange.isEmpty && usedRange.address) {
                const parts = usedRange.address.split('!');
                if (parts.length > 1) {
                    const addressParts = parts[1].split(':');
                    if (addressParts.length > 1) {
                        const matchResult = addressParts[1].match(/\d+/);
                        if (matchResult) {
                            startRow = parseInt(matchResult[0]) + 3;
                        }
                    }
                }
            }

            switch(tableType) {
                case 'datatype':
                    await createDatatypeTable(context, sheet, startRow, tableName);
                    break;
                case 'spreadsheet':
                    await createSpreadsheetTable(context, sheet, startRow, tableName);
                    break;
                default:
                    throw new Error('Unsupported table type: ' + tableType);
            }

            await context.sync();
        });
    } catch (error) {
        console.error('Error creating table:', error);
        showErrorMessage(error.message);
    }
}

async function createSpreadsheetTable(context, sheet, startRow, tableName) {
    try {
        console.log(`Creating spreadsheet table "${tableName}" at row ${startRow}`);
        
        const rowCount = parseInt(document.getElementById('rowCount').value);
        if (rowCount < 1) {
            throw new Error('Row count must be greater than 0');
        }

        const parameters = getParameters();
        const parameterList = formatParameterList(parameters);

        // Create header row with three columns
        const headerRange = sheet.getRange(`B${startRow}:D${startRow}`);
        headerRange.values = [[`Spreadsheet SpreadsheetResult ${tableName}${parameterList}`, "", ""]];
        headerRange.merge();
        await context.sync();

        // Format header as before...
        headerRange.format.font.name = "Franklin Gothic Book";
        headerRange.format.font.size = 10;
        headerRange.format.font.color = "#A5A5A5";
        headerRange.format.fill.color = "white";
        headerRange.format.horizontalAlignment = "Left";
        headerRange.format.borders.getItem('EdgeTop').style = 'Continuous';
        headerRange.format.borders.getItem('EdgeBottom').style = 'Continuous';

        // Create subheader row (Step and Formula)
        const subheaderRow = startRow + 1;
        const stepCell = sheet.getRange(`B${subheaderRow}`);
        const formulaCell = sheet.getRange(`C${subheaderRow}:D${subheaderRow}`);

        // Format Step cell as before...
        stepCell.values = [["Step"]];
        stepCell.format.font.name = "Franklin Gothic Book";
        stepCell.format.font.size = 10;
        stepCell.format.font.bold = true;
        stepCell.format.fill.color = "#F2F2F2";
        stepCell.format.horizontalAlignment = "Left";

        // Format Formula cells (merged) as before...
        formulaCell.values = [["Formula", ""]];
        formulaCell.merge();
        formulaCell.format.font.name = "Franklin Gothic Book";
        formulaCell.format.font.size = 10;
        formulaCell.format.font.bold = true;
        formulaCell.format.fill.color = "#DCE6F1";
        formulaCell.format.horizontalAlignment = "Left";

        await context.sync();

        // Create body rows
        for (let i = 0; i < rowCount; i++) {
            const currentRow = startRow + i + 2;
            const isLastRow = i === rowCount - 1;
            
            const stepCell = sheet.getRange(`B${currentRow}`);
            const formulaCell = sheet.getRange(`C${currentRow}:D${currentRow}`);

            // Add the ' = ' prefix to formula cell
            if (!isLastRow) {
                formulaCell.values = [[" = ", ""]];
            }
            formulaCell.merge();

            // Format step cell as before...
            stepCell.format.font.name = "Franklin Gothic Book";
            stepCell.format.font.size = 10;
            stepCell.format.font.color = "#A5A5A5";
            stepCell.format.fill.color = "white";
            stepCell.format.horizontalAlignment = "Left";

            // Format formula cell with same formatting as before
            formulaCell.format.font.name = "Franklin Gothic Book";
            formulaCell.format.font.size = 10;
            formulaCell.format.font.color = "#A5A5A5";
            formulaCell.format.fill.color = "#DCE6F1";
            formulaCell.format.horizontalAlignment = "Left";
            
            // Clear borders
            [stepCell, formulaCell].forEach(cell => {
                ['EdgeTop', 'EdgeBottom', 'EdgeLeft', 'EdgeRight'].forEach(edge => {
                    cell.format.borders.getItem(edge).style = 'None';
                });
            });

            // Add borders for last row
            if (isLastRow) {
                [stepCell, formulaCell].forEach(cell => {
                    cell.format.borders.getItem('EdgeTop').style = 'Continuous';
                    cell.format.borders.getItem('EdgeBottom').style = 'Continuous';
                });
            }
        }

        await context.sync();
        
        // Show success page after table is created
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        
        const successPage = document.getElementById('successPage');
        if (successPage) {
            successPage.classList.add('active');
        } else {
            console.error('Success page not found');
        }
    } catch (error) {
        console.error('Error creating spreadsheet table:', error);
        throw error;
    }
}