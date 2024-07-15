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
            form.clientScriptModulePath = './SDC_quoteToOpp_CS.js';
        }
    };

    return { beforeLoad };
});
