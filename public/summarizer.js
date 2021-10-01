var Summarizer = {};
Summarizer.Utility = {};

// Get text
Summarizer.Utility.getTextFromHtml = function (someHtmlDoc) {
  var tmp = document.createElement("DIV");
  tmp.innerHTML = someHtmlDoc;
  return tmp.textContent || tmp.innerText;
}

// Get sentences from text.
Summarizer.Utility.getSentences = function (text) {
  var sentences = text.split(/\. |\.|\?|!|\n/g);
  $(sentences).each(function (idx) {
    sentences[idx] = $.trim(sentences[idx]);
  });
  sentences = $(sentences).filter(function (idx) {
    return sentences[idx].length > 0;
  });
  return sentences;
}

// Calculate similarity between 2 sentences.
Summarizer.Utility.calculateSimilarity = function (sentence1, sentence2) {
  var words1 = filterIO(sentence1);
  var words2 = filterIO(sentence2);
  var intersection = _.intersection(words1, words2);
  var sumOfLengths = Math.log(words1.length) + Math.log(words2.length);
  if (sumOfLengths == 0) {
    return 0;
  } else {
    return intersection.length / sumOfLengths; // JS uses floating point arithmetic by default.
  }
}

// Make graph.
Summarizer.Utility.makeGraph = function (sentences) {
  var graph = {};
  for (var idx1 = 0; idx1 < sentences.length; ++idx1) {
    for (var idx2 = idx1 + 1; idx2 < sentences.length; ++idx2) {
      if (graph[idx1] == undefined) {
        graph[idx1] = [];
      }

      if (graph[idx2] == undefined) {
        graph[idx2] = [];
      }
      var similarityScore = Summarizer.Utility.calculateSimilarity(
        sentences[idx1], sentences[idx2]);
      graph[idx1].push({
        "node": idx2,
        "weight": similarityScore
      });
      graph[idx2].push({
        "node": idx1,
        "weight": similarityScore
      });
    }
  }
  
  graph.sentenceIdLookup = sentences;
  return graph;
}

// Page Rank calculation driver.
Summarizer.Utility.calculatePageRank = function (graph, maxIterations,
  dampingFactor, delta) {
  var pageRankStruct = {};
  var totalWeight = {};
  var totalNumNodes = graph.sentenceIdLookup.length; 
  for (var idx = 0; idx < totalNumNodes; ++idx) {
    pageRankStruct[idx] = {
      "oldPR": 1.0,
      "newPR": 0.0
    };
    totalWeight[idx] = 0.0;
  }
  for (var idx = 0; idx < totalNumNodes; ++idx) {
    var adjacencyList = graph[idx];
    if (adjacencyList == undefined) {
      continue;
    }
    // The adjacency list is an array containing objects that contain the neighbours' index as
    // key and similarity score as the weight.
    _.each(adjacencyList, function (item) {
      totalWeight[idx] += item["weight"];
    });
  }
  var converged = false;
  for (var iter = 0; iter < maxIterations; ++iter) {
    maxPRChange = Summarizer.Utility.runPageRankOnce(graph, pageRankStruct,
      totalWeight, totalNumNodes, dampingFactor);
    if (maxPRChange <= (delta / totalNumNodes)) {
      converged = true;
      break;
    }
  }
  var pageRankResults = {};
  for (var idx = 0; idx < totalNumNodes; ++idx) {
    pageRankResults[idx] = {
      "PR": pageRankStruct[idx]["oldPR"] / totalNumNodes,
      "sentence": graph.sentenceIdLookup[idx]
    };
  }
  return pageRankResults;
}


// Single iteration of Page Rank.
Summarizer.Utility.runPageRankOnce = function (graph, pageRankStruct,
  totalWeight, totalNumNodes, dampingFactor) {
  var sinkContrib = 0.0;
  for (var idx = 0; idx < totalNumNodes; ++idx) {
    if (graph[idx] == undefined || graph[idx].length == 0) {
      // Sink.
      sinkContrib += pageRankStruct[idx]["oldPR"];
      continue;
    }
    var wt = 0.0;
    // Now iterate over all the nodes that are pointing to this node.
    _.each(graph[idx], function (adjNode) {
      var node = adjNode["node"];
      // Get the total weight shared by this adjacent node and its neighbours.
      var sharedWt = totalWeight[node];
      if (sharedWt != 0) { 
        wt += (adjNode["weight"] / sharedWt) * pageRankStruct[node]["oldPR"];
      }
    });
    wt *= dampingFactor;
    wt += (1 - dampingFactor);
    // Update the structure with the new PR.
    pageRankStruct[idx]["newPR"] = wt;
  }
  
  sinkContrib /= totalNumNodes;
  var max_pr_change = 0.0;
  for (var idx = 0; idx < totalNumNodes; ++idx) {
    pageRankStruct[idx]["newPR"] += sinkContrib;
    // Report back the max PR change.
    var change = Math.abs(pageRankStruct[idx]["newPR"] - pageRankStruct[idx][
      "oldPR"
    ]);
    if (change > max_pr_change) {
      max_pr_change = change;
    }
    // Set old PR to new PR for next iteration.
    pageRankStruct[idx]["oldPR"] = pageRankStruct[idx]["newPR"];
    pageRankStruct[idx]["newPR"] = 0.0;
  }
  return max_pr_change;
}
var stopwords = ["a", "about", "above", "above", "across", "after",
  "afterwards", "again", "against", "all", "almost", "alone", "along",
  "already", "also","although","always","am","among", "amongst",
  "amoungst", "amount",  "an", "and", "another", "any","anyhow","anyone",
  "anything","anyway", "anywhere", "are", "around", "as",  "at", "back",
  "be","became", "because","become","becomes", "becoming", "been",
  "before", "beforehand", "behind", "being", "below", "beside",
  "besides", "between", "beyond", "bill", "both", "bottom","but",
  "by", "call", "can", "cannot", "cant", "co", "con", "could",
  "couldnt", "cry", "dne", "describe", "detail",  "do", "does", "done",  "down",
  "due", "during", "each", "eg", "eight", "either", "eleven","else",
  "elsewhere", "empty", "enough", "etc", "even", "ever", "every",
  "everyone", "everything", "everywhere", "except", "few", "fifteen",
  "fify", "fill", "find", "fire", "first", "five", "for", "former",
  "formerly", "forty", "found", "four", "from", "front", "full",
  "further", "get", "give", "go", "had", "has", "hasnt", "have",
  "he", "hence", "her", "here", "hereafter", "hereby", "herein",
  "hereupon", "hers", "herself", "him", "himself", "his", "how",
  "however", "hundred", "ie", "if", "in", "inc", "indeed",
  "interest", "into", "is",  "it", "its", "itself", "keep",
  "last", "latter", "latterly", "least", "less", "ltd", "made",
  "many", "may", "me", "meanwhile", "might", "mill", "mine",
  "more", "moreover", "most", "mostly", "move", "much", "must", "my",
  "myself", "name", "namely", "neither", "never", "nevertheless", "next",
  "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now",
  "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto",
  "or", "other", "others", "otherwise", "our", "ours", "ourselves", "out",
  "over", "own","part", "per", "perhaps", "please", "put", "rather", "re",
  "same", "see", "seem", "seemed", "seeming", "seems", "serious", "several",
  "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so",
  "some", "somehow", "someone", "something", "sometime", "sometimes", "somewhere",
  "still", "such", "system", "take", "ten", "than", "that", "the", "their", "them",
  "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore",
  "therein", "thereupon", "these", "they", "thickv", "thin", "third", "this",
  "those", "though", "three", "through", "throughout", "thru", "thus", "to",
  "together", "too", "top", "toward", "towards", "twelve", "twenty", "two",
  "un", "under", "until", "up", "upon", "us", "very", "via", "was", "way", "we",
  "well", "were", "what", "whatever", "when", "whence", "whenever", "where",
  "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever",
  "whether", "which", "while", "whither", "who", "whoever", "whole", "whom",
  "whose", "why", "will", "with", "within", "without", "would", "yet", "you",
  "your", "yours", "yourself", "yourselves", "the",
  // contractions?
  "didnt", "doesnt", "dont", "isnt", "wasnt", "youre", "hes", "ive", "theyll",
  "whos", "wheres", "whens", "whys", "hows", "whats", "were", "shes", "im", "thats"
  ];
  
  var stopwordsRE = new RegExp(stopwords.join("|"), "gi");
  
  function filterIO(text) {
    var words = text.split(' ');
    var keywords = [];
    for (var i = 0; i < words.length; i++) {
      var word = words[i].toLowerCase().replace(/[^a-zA-Z]/, '');
      if (stopwords.indexOf(word) === -1 && keywords.indexOf(word) === -1) {
        keywords.push(word);
      }
    }
    return keywords;
  }