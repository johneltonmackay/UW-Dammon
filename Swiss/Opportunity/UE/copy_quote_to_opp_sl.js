/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', 'N/error'],
    /**
 * @param{record} record
 * @param{redirect} redirect
 */
    (record, redirect, error) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const CONTEXT_METHOD = {
            GET: "GET",
            POST: "POST"
        };

        const onRequest = (scriptContext) => {
            try {
                if (scriptContext.request.method == CONTEXT_METHOD.GET) {
                    const paramRecId = scriptContext.request.parameters['recordId'];
                    let errorMessage = ""
                    if (paramRecId){
                        log.debug('onRequest GET paramRecId', paramRecId)

                        let arrQuoteData = getQuoteData(paramRecId)
                        log.debug('onRequest GET arrQuoteData', arrQuoteData)

                        if (arrQuoteData.length > 0){

                            let objResults = setOpportunityRecord(arrQuoteData)

                            if (objResults.success){
                                redirect.toRecord({
                                    type: 'opportunity',
                                    id: intOppId,
                                });
                            } else {
                                errorMessage = objResults.message
                                customErrorMessage(errorMessage)
                            }
                        } else {
                            errorMessage = 'No related Opportunity found.'
                            customErrorMessage(errorMessage)
                        }
                    }
                }
            } catch (err) {
                log.error('ERROR ONREQUEST:', err.message)
            }
        }

        const customErrorMessage = (errorMessage) => {
            let myCustomError = error.create({
                name: "Copy Opportunity Record Failed",
                message: "Record Failed to Copy due to errors. Error Messages: " + errorMessage,
            });
            log.error("onRequest error", myCustomError.message);
            throw myCustomError.message;  
        }

        const getQuoteData = (paramRecId) => {
            let arrQuoteData = []
            const objQuoteRecord = record.load({
                type: 'estimate',
                id: paramRecId,
                isDynamic: true
            })
            log.debug('getQuoteData objQuoteRecord', objQuoteRecord)
            if (objQuoteRecord){
                let opportunityId = objQuoteRecord.getValue({
                     fieldId: 'custbody_related_opportunity' 
                    });
                if (opportunityId){
                    var numLines = objQuoteRecord.getLineCount({
                        sublistId: 'item'
                    });
                    log.debug("getQuoteData numLines", numLines)
                    if (numLines > 0) {
                        for (var i = 0;  i < numLines; i++) {
                            let intItem = objQuoteRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            })
                            let intQty = objQuoteRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i
                            })
                            let intRate = objQuoteRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i
                            })
                            arrQuoteData.push({
                                recId: opportunityId,
                                item: intItem,
                                quantity: intQty,
                                rate: intRate
                            })
                        }
                    }
                } 
            }
            return arrQuoteData
        }

        const setOpportunityRecord = (arrQuoteData) => {
            try {
                let intOppId = ""
                const opportunityRecord = record.load({
                    type: record.Type.OPPORTUNITY,
                    id: arrQuoteData[0].recId,
                    isDynamic: true
                });
    
                if (opportunityRecord){

                    let lineCount = opportunityRecord.getLineCount({
                        sublistId: 'item'
                    });
    
                    for (let i = lineCount - 1; i >= 0; i--) {
                        // Remove all existing line items from the Opportunity
                        opportunityRecord.removeLine({
                             sublistId: 'item',
                             line: i,
                             ignoreRecalc: true 
                        });
                    }
    
                    arrQuoteData.forEach(data => {
                        opportunityRecord.selectNewLine({
                            sublistId: 'item' 
                        });
    
                        opportunityRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: data.item 
                        });
    
                        opportunityRecord.setCurrentSublistValue({ 
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: data.quantity 
                        });
    
                        opportunityRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: data.rate 
                        });
    
                        opportunityRecord.commitLine({
                            sublistId: 'item'
                        });
    
                        intOppId = opportunityRecord.save();
                        log.debug('setOpportunityRecord updated opportunityId', opportunityId)
                    });
                }

                return {
                    success: true,
                    oppId: intOppId,
                };
                
            } catch (error) {
                log.error('setOpportunityRecord error', error.message);
                return {
                    success: false,
                    message: error.message
                };
            }
        }


        return {onRequest}

    });
