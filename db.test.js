db.rdv.aggregate([
  {
    $group: {
      _id: { $dayOfWeek: '$date_rdv' }, // Extract day of the week
      count: { $sum: 1 } // Count the number of RDVs for each day
    }
  },
  {
    $group: {
      _id: null,
      avgCount: { $avg: '$count' } // Calculate the average count for all days
    }
  }
]);
db.rdv.aggregate([
  {
    $group: {
      _id: { $dayOfWeek: '$date_rdv' }, // Extract day of the week
      count: { $sum: 1 } // Count the number of RDVs for each day
    }
  }
]);

db.rdv.aggregate([
    {
        $group: {
            _id: { $dayOfWeek: "$date_rdv" }, 
            count: { $sum: 1 } 
        }
    },
    {
        $group: {
            _id: null,
            avgCount: { $avg: "$count" }
        }
    }
]);

