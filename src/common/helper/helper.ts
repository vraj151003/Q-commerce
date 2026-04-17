

export function calculateGSTPerItem(
    sellerState : string,
    customerState : string,
    amount : number,
    gstRate : number = 18,
){
    const tax = (amount * gstRate) /100;
     if(sellerState === customerState)
     {
        return {
            cgst : tax/2,
            sgst : tax/2,
            igst : 0,
            totalTax : tax
        }
     }
     else {
        return {
            cgst : 0,
            sgst : 0,
            igst : tax,
            totalTax : tax
        }
     }
}