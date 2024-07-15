/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/log'],
function(record, search, runtime, log) {
    function beforeLoad(scriptContext) {
        log.debug('CONTEXT', scriptContext.type);
        try {
           if (scriptContext.type === scriptContext.UserEventType.VIEW){

            addCopyButton(scriptContext)

           }
        } catch (err) {
            log.error({title: 'beforeLoad Error', details: err.message});
        }
    }

    // Private Function

    const addCopyButton = (scriptContext) => {
        try {
            const objRecord = scriptContext.newRecord;
            const objForm = scriptContext.form;
            log.debug('objRecord', objRecord);
            log.debug('objForm', objForm);
    
            const stSuiteletLinkParam = runtime.getCurrentScript().getParameter({
                name: 'custscript_suitelet_id'
            });
            log.debug('stSuiteletLinkParam', stSuiteletLinkParam);
            const recordId = objRecord.id;
            log.debug('recordId', recordId);
            
            // Construct the Suitelet URL with the parameter
            const suiteletURL = `\"${stSuiteletLinkParam}&recordId=${recordId}\"`;
       
    
            objForm.addButton({
                id: 'custpage_copy_button',
                label: 'Copy Line Items to Opportunity',
                functionName: `window.open('${suiteletURL}')`
            });
    
        } catch (err) {
            log.error('addCopyButton', err.message);
        }
    };
    
    return {
        beforeLoad: beforeLoad
    };
});
