// $(document).ready(initJS);
// function initJS() {
  // Configure this object for tweaking summarization params.
  var configObj = {
    "maxIter": 100,
    "dampingFactor": 0.85,
    "delta": 0.5
  };
// }

  function sumUp( inputText ){
    var inputToSummarize = $.trim(inputText);
    if (inputToSummarize.length == 0) {
      // $(outputText).val("No text to be summarized...");
      alert("no text to summarize") ;
    } else {
      // Invoke the summarizer algo.
      var sentences = Summarizer.Utility.getSentences(inputToSummarize);
      var graph = Summarizer.Utility.makeGraph(sentences);
      var result = Summarizer.Utility.calculatePageRank(graph, configObj.maxIter,
        configObj.dampingFactor, configObj.delta);

      var arr = [];
      var idx = 0;
      _.each(result, function (v, k) {
        arr.push({
          "sentence": v.sentence,
          "PR": v.PR,
          "idx": idx++
        });
        // console.log("sentence: " + v.sentence + ", PR: " + v.PR);
      });

      // Sort in descending order of PR.
      arr = arr.sort(function (a, b) {
        return b.PR - a.PR;
      });

      // Just returning half the original number of lines.
      var halfNumLines = Math.floor(arr.length / 2);
      if (halfNumLines == 0) {
        halfNumLines = arr.length;
      }

      // Collect the half number of lines and sort them according to their occurence in the original text.
      arr = arr.splice(0, halfNumLines);
      arr = arr.sort(function (a, b) {
        return a.idx - b.idx;
      });
      var finalResult = "";
      for (var idx = 0; idx < halfNumLines; ++idx) {
        finalResult += arr[idx].sentence + ". ";
      }
      return finalResult ;
      // $(outputText).val(finalResult);
    }
  }