
const ranks = [11,10,10,10,10,9,8,7,6,5,4,3,2]
# with a random flush, what percetage is over 300?
# how many combinations of 11 choose 4?

def main [] {
  let flushes = combinations $ranks 5 | each { |hand|
    { 
      score: (4 * ((35 + ($hand | math sum))))
      hand: ($hand | str join ",")
    }
  }
  let total = $flushes | length
  let viable = $flushes | where {|f| $f.score > 300 } | length
  print $"Viable flushes: ($viable / $total * 100)%"
  print $"Median flush score: ($viable / $total * 100)%"

}

def combinations [items: list<any> size: int] {
    if ($size == 0) { return [[]] }
    if ($items | is-empty) { return [] }

    let first = $items | first
    let rest = $items | skip 1

    let without_first = (combinations $rest $size)
    let with_first = (combinations $rest ($size - 1)) | each {|x| [$first] | append $x }

    $with_first | append $without_first
}

def next_binomial [] {
  window 2 
  | each { |pair| $pair.0 + $pair.1 }
  | prepend 1
  | append 1
}

# 11 choose 5 == 462
def calc [] {
  seq 1 11
  | reduce -f [1] { |_ acc| 
    $acc | next_binomial
  }
  | get 5
}
