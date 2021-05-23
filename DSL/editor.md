# Grammar
Main -> (CommentedTransitions | CommentedScenario)*
CommentedTransitions -> Comment* Transitions
Comment -> <input field>
Transitions -> GivenClause WhenClause? ThenClause
GivenClause -> State+  CompoundState? StateIdentifierClause?
WhenClause -> Event JavaScriptIdentifier?
ThenClause -> UnguardedTransitionClause  | GuardedTransitionsClause
Here I cannot require the user to know in advance which type it will be....
ThenClause -> UnguardedTransitionClause  | GuardedTransitionsClause
UnguardedTransitionClause -> Action* ActionIdentifier?
GuardedTransitionsClause -> (IfClause SimpleThenClause)*
IfClause -> Guard GuardIdentifierClause?
Guard -> <input field>
SimpleThenClause -> Action* ActionIdentifier? TargetClause
TargetClause -> <select > ref. states

# State machines
put the yed graph here

- load a tab
  - positioned at first element
  - OR save the state of the navigation in the file (as an optional comment, first line, but then add it to grammar? or special ## anywhere in the file, comments that are eliminated)
- navigation
  - ctrl-arrows
    - nothing to do if I use content editable. 
    - non-editable content should be editable, but 
      - capture all keys, except delete
      - delete should highlight the whole tab with descendant in the parse tree, delete twice should then delete the whole thing IF that makes sense for the given grammar
      - highlight is background color + vertical bracket in the left margin
    - ctrl arrow at the end of span -> go to end of next span
  - arrows
    - nothing to do for non-editable content (capture all other keys except delete cf. before)
    - when reaching the end of the field, set focus on the next field, positioned at begining 
  - delete key
    - first delete: highlight appropriate container div
    - second delete: delete appropriate structure
    
When I type:
- immutable element: ignore
- mutable element: mutate
- indeterminate element: autocomplete proposal till autocomplete done

I start with 

<div root> <div indeterminate> </div root> editable
- typed # -> <div root> <div comment> <div terminal input> </div comment></div root>
- typed G -> 

## Style
- always highlight the element with focus
- sometimes highlight two elements (do ... end) when focus
  - can use CSS property and CSS focus rule? YES

## Behavior
- use content editable for all
- filter out all key pressed for immutable elements, only keep arrows navigation and delete
- for mutable elements, suppress return key when not allowed (think about multiline later but should be allowed in some places)
- every relevant structure should have a div
  - <div while><span While/><span condition/><span do/>...<span end/></div>
  - style with: div.while>span.while etc.
  - span do and span end can have same class (they are coupled) with single styling (based on custom property: highlit or not). Alternative is to set a class on both but that's a little less generalizable later to any grammar tree
- send an *element change* event when focus enters an element anew
