// each method here is going to take in an array 
// that array is all of the eligible predictions from different machine learning algorithms for that particular row ID. In other words, maybe we have trained 10 algos, but for this set, we are considering the results we might get from only 3 of them. the arr will simply be the predicted values from those three algos. 
module.exports = {
  average: function(arr) {
    var sum = arr.reduce(function(total,current) {
      return total + current;
    }, 0);
    return sum / arr.length;
  }
}
