/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*/
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/runtime'],
(record, serverWidget, search, runtime) => {

    const beforeLoad = (context) => {
        if (context.type === context.UserEventType.VIEW) {
            const form = context.form;
            const quoteRecord = context.newRecord;

            // Add a button to the Quote form
            form.addButton({
                id: 'custpage_copy_line_items',
                label: 'Copy Line Items to Opportunity',
                functionName: 'copyLineItemsToOpportunity'
            });

            // Add the script to handle the button click
            form.clientScriptModulePath = './CopyLineItemsClientScript.js';
        }
    };

    return { beforeLoad };
});

/**
* @NApiVersion 2.1
* @NScriptType ClientScript
*/
define(['N/record', 'N/ui/dialog', 'N/search', 'N/runtime'],
(record, dialog, search, runtime) => {

    const copyLineItemsToOpportunity = (scriptContext) => {
        try {
            const quoteId = scriptContext.currentRecord.id;

            // Load the Quote record
            const quoteRecord = record.load({
                type: record.Type.ESTIMATE,
                id: quoteId,
                isDynamic: true
            });

            // Get the Opportunity ID from the Quote's custom field
            const opportunityId = quoteRecord.getValue({ fieldId: 'custbody_related_opportunity' });
            if (!opportunityId) {
                dialog.alert({ title: 'Error', message: 'No related Opportunity found.' });
                return;
            }

            // Load the Opportunity record
            const opportunityRecord = record.load({
                type: record.Type.OPPORTUNITY,
                id: opportunityId,
                isDynamic: true
            });

            // Remove all existing line items from the Opportunity
            const lineCount = opportunityRecord.getLineCount({ sublistId: 'item' });
            for (let i = lineCount - 1; i >= 0; i--) {
                opportunityRecord.removeLine({ sublistId: 'item', line: i });
            }

            // Dynamically load custom column fields
            const customFields = search.createColumn({
                fieldId: 'customfields'
            }).columns;

            // Copy line items from the Quote to the Opportunity
            const quoteLineCount = quoteRecord.getLineCount({ sublistId: 'item' });
            for (let i = 0; i < quoteLineCount; i++) {
                quoteRecord.selectLine({ sublistId: 'item', line: i });

                // Get standard fields
                const item = quoteRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                const quantity = quoteRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' });
                const rate = quoteRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'rate' });

                opportunityRecord.selectNewLine({ sublistId: 'item' });
                opportunityRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: item });
                opportunityRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: quantity });
                opportunityRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: rate });

                // Set custom fields dynamically
                customFields.forEach(field => {
                    const fieldValue = quoteRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: field });
                    opportunityRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: field, value: fieldValue });
                });

                opportunityRecord.commitLine({ sublistId: 'item' });
            }

            // Save the Opportunity record
            opportunityRecord.save();

            dialog.alert({ title: 'Success', message: 'Line items copied to the Opportunity successfully.' });

        } catch (error) {
            dialog.alert({ title: 'Error', message: 'An error occurred: ' + error.message });
        }
    };

    return { copyLineItemsToOpportunity };
});
