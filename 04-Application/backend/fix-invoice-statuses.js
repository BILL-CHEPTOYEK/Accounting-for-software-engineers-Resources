// Fix existing invoice statuses based on payment allocations
const db = require('./models');

async function fixInvoiceStatuses() {
  try {
    console.log('🔧 Starting invoice status fix...');
    
    // Get all invoices that might have payment issues
    const invoices = await db.Invoice.findAll({
      include: [
        { 
          model: db.PaymentAllocation, 
          as: 'paymentAllocations',
          include: [{ model: db.Payment, as: 'payment' }]
        }
      ]
    });
    
    console.log(`📊 Found ${invoices.length} invoices to check`);
    
    for (const invoice of invoices) {
      const totalAmount = parseFloat(invoice.total_amount);
      let totalPaidFromAllocations = 0;
      
      // Calculate total paid from payment allocations
      if (invoice.paymentAllocations && invoice.paymentAllocations.length > 0) {
        totalPaidFromAllocations = invoice.paymentAllocations.reduce((sum, allocation) => {
          return sum + parseFloat(allocation.allocated_amount || 0);
        }, 0);
      }
      
      // Check if amount_paid matches allocations
      const currentAmountPaid = parseFloat(invoice.amount_paid || 0);
      const outstanding = totalAmount - totalPaidFromAllocations;
      
      console.log(`\n📋 Invoice ${invoice.document_no}:`);
      console.log(`   Total: $${totalAmount}`);
      console.log(`   Current amount_paid: $${currentAmountPaid}`);
      console.log(`   Allocations total: $${totalPaidFromAllocations}`);
      console.log(`   Outstanding: $${outstanding}`);
      console.log(`   Current status: ${invoice.status}`);
      
      // Fix the invoice if needed
      if (Math.abs(currentAmountPaid - totalPaidFromAllocations) > 0.01 || 
          (totalPaidFromAllocations > 0 && !['Paid', 'Partially Paid'].includes(invoice.status))) {
        
        console.log(`   🔄 FIXING: Updating amount_paid from $${currentAmountPaid} to $${totalPaidFromAllocations}`);
        
        // Update amount_paid and save (this will trigger beforeSave hook)
        invoice.amount_paid = totalPaidFromAllocations;
        await invoice.save();
        
        console.log(`   ✅ FIXED: New status = ${invoice.status}, Outstanding = $${invoice.outstanding_balance}`);
      } else {
        console.log(`   ✅ OK: No changes needed`);
      }
    }
    
    console.log('\n🎉 Invoice status fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing invoice statuses:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixInvoiceStatuses();
