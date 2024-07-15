/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/record', 'N/ui/dialog', 'N/currentRecord'], (record, dialog, currentRecord) => {
    const copyLineItemsToOpportunity = () => {
        try {
            let currentRec = currentRecord.get();
            let quoteId = currentRec.id;

           // console.log('Quote ID:', quoteId);

            // Load the Quote record
            let quoteRecord = record.load({
                type: record.Type.ESTIMATE,
                id: quoteId,
                isDynamic: true
            });

            // Get the Opportunity ID from the Quote's custom field
            let opportunityId = quoteRecord.getValue({ fieldId: 'opportunity' });
            if (!opportunityId) {
                dialog.alert({ title: 'Error', message: 'No related Opportunity found.' });
                return;
            }

            // Load the Opportunity record
            let opportunityRecord = record.load({
                type: record.Type.OPPORTUNITY,
                id: opportunityId,
                isDynamic: true
            });

            // Remove all existing line items from the Opportunity
            let lineCount = opportunityRecord.getLineCount({ sublistId: 'item' });
            for (let i = lineCount - 1; i >= 0; i--) {
                opportunityRecord.selectLine({ sublistId: 'item', line: i });
                opportunityRecord.removeLine({ sublistId: 'item', line: i, ignoreRecalc: true });
            }

            // console.log('Existing line items removed from Opportunity');

            // Get the sublist fields from the quote
            let itemFields = quoteRecord.getSublistFields({ sublistId: 'item' });
            let quoteLineCount = quoteRecord.getLineCount({ sublistId: 'item' });
            let oppFields = opportunityRecord.getSublistFields({ sublistId: 'item' });

           // console.log('Quote Sublist Fields:', itemFields);
           // console.log('Opportunity Sublist Fields:', oppFields);

            // Define fields to be skipped
            const skipFields = ['_id', 'line', 'lineuniquekey', 'linenumber'];

            // Add new line items
            for (let i = 0; i < quoteLineCount; i++) {
                opportunityRecord.selectNewLine({ sublistId: 'item' });

                itemFields.forEach(field => {
                    if (!skipFields.includes(field) && oppFields.includes(field)) {
                        let fieldValue = quoteRecord.getSublistValue({ sublistId: 'item', fieldId: field, line: i });
                        if (fieldValue !== undefined && fieldValue !== null) {
                            opportunityRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: field,
                                value: fieldValue
                            });
                        }
                    }
                });

                opportunityRecord.commitLine({ sublistId: 'item' });
            }

            // console.log('New line items added to Opportunity');

            // Save the Opportunity record
            opportunityRecord.save();

            dialog.alert({ title: 'Success', message: 'Line items copied to the Opportunity successfully.' });

        } catch (error) {
            console.error('Error:', error.message);
            dialog.alert({ title: 'Error', message: 'An error occurred: ' + error.message });
        }
    };

    const pageInit = (context) => {
        // Additional logic on page initialization if needed
    };

    return {
        pageInit: pageInit,
        copyLineItemsToOpportunity: copyLineItemsToOpportunity
    };
});