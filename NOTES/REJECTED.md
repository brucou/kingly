# Rejected
- Do leonardo.io (vanilla JS should be the simplest to reimplement)
  - but does not demonstrate so much about benefits? just a nice demo?
  - (use D3, use popup/modals, use component (color picker) etc)
=> NO! Leonardo already written without framework, and there is almost to no modes, so value of state machines is little
- Do excalidraw example (React, https://excalidraw.com/)
  - design / impl. / test
  - put on example of doc sites
  - update lesson learnt, cookbook, best practices
  - WITH SVELTE - then set a repository for folks to do it in their own framework = BUZZ
(the guy was not so friendly, and anyways it may be too much code to understand. Also not too much modality there. And not too much benefits of using machines.)
- same thing with Oracle demo (more complete and nice!):
  - https://www.oracle.com/webfolder/technetwork/jet-320/globalExamples-App-FixItFast.html (get the zip)
(idea is good, but seems too complex -- hybrid app.... Interesting because makes think about how to breakdown UI in components (same machine) vs. processes (different machines). It is all about state visibility vs. behavior indepedence -- you don't want the indep. machine to be sensitive to event in first machine by mistake?)
- demo with machine in worker only sending changed prop to DOM for rendering?
(in the end no, that is too edge a case for the effort)
- Suspense component in Svelte with compiled version
  - including SuspenseList
  - try to include page transitions too?
(too simple a machine -- too much compiled code for it but the API was good though)
- Do plyr popular video player (https://github.com/sampotts/plyr/blob/master/src/js/controls.js)
  - not too sure anymore what was the interest but popular, very accessible
(not too many modes here... bad example for a state machine modelization)
- an example of parallel charts (https://tritarget.org/#Statechart%20based%20form%20manager) to do with multicasting events and Kingly
(I actually don't understand the example, anywyas poor user interface, no docs, not worth my time)
- don't do but modelize the popular flatpickr
  - https://flatpickr.js.org/examples/#range-calendar
  - I only have one mode which is when I can select a range of dates
  - the rest is view logic, not behaviour in sense of a = f(e,s)
    - because view = f(props) pure, there is no state hence no machine needed
    - now the view can have ifs all as necessary, still don't need a machine
    - and if we do by diff v = f(p), v + dv = f(p + dp); we have dp, we need dv, dv = h(dp) find h from f
      - given f such as v = f(p) find h such that dv = h(dp)
      - templates framework compute h for us
      - render framwork too via reconciliation
      - we can also do it by hand
        - if we see dp as an event, then dv = h(dp) with h pure means that we have no state so no machine!
(no machine needed here, no modality)
- do proxx game from google, 
  - https://github.com/GoogleChromeLabs/proxx
  - https://proxx.app/
  - have a section on modelization and show the state machines for it 
  - no routing here : great! just skip the worker things
  - and talk about it in some architecture section
  - ADD a undo/redo that is sorely missing
  - see if I do the animation or not
(could be too complicated? workers etc. but there seems to be modality here. But it is a game we already know that game fits fsm)
- boulderdash game!!
    - or pacman : https://github.com/platzhersh/pacman-canvas, from https://superdevresources.com/open-source-html5-games/
  - dinosaur google gam : simple and known abd linkable o twnsor flow
    - https://cs.chromium.org/chromium/src/components/neterror/resources/offline.js?q=t-rex+package:%5Echromium$&dr=C&l=7
    - https://github.com/Code-Bullet/Google-Chrome-Dino-Game-AI
    - webstorm dir Genetic algorithm
  - use https://itnext.io/a-wicked-custom-elements-alternative-6d1504b5857f to have web 
  components without needing custom elements!!
  - mario game : https://github.com/mahsu/MariOCaml/blob/master/director.ml and https://github.com/reasonml-community/Mareo 
  - could also reuse shop microfrontends : https://micro-frontends.org/
  - game demo with https://codeincomplete.com/posts/javascript-gauntlet-foundations/, also boulder 
    dash
  - simple game demo : snake with ivi
     - https://github.com/localvoid/ivi-examples/tree/master/packages/apps/snake

# Editors
- add bpmn.io!!! It has nesting. cf. /assets/diagram.bpmn.xml (it is a bpmn file though)
  - compound states: subProcess
  - atomic state: task
  - startEvent: init event
  - transition: sequenceFlow
- that seems to be easier actually than yed
- traverse the xml graph and create objects (all the transitions, create the hierarchy on the fly)
- then massage the created objects into the desired objects
- BUT! There is no history pseudo-states (maybe will have to add a custom element...)
  - or use the data store reference (history is also stored so could work)
- better for small graphs because it does not collapse compound states...
  - which makes sense because if collapsed what layout show? if extended what layout show? 
  - also big nodes, so harder to navigate in the end
- could be worth doing in order to achieve some cross-promotion with camunda?? 

=> rejected because lot of work (poor documentation, little conversation going with the guys) and also poor UIs of bpmn.io for nesting (visual nesting, no collapsing).


BUUUTTTT COULD REVISIT. I understand now better the UI and the bpmn format!

This is with nested compound states. process => subprocess => subprocess => stuff 

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_0esoqrf" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="8.2.0">
  <bpmn:process id="Process_12phfx4" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1ju4rbo">
      <bpmn:outgoing>Flow_07j2lit</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:subProcess id="Activity_0vftnjs">
      <bpmn:incoming>Flow_07j2lit</bpmn:incoming>
      <bpmn:subProcess id="Activity_0moinen">
        <bpmn:incoming>Flow_09hzfr3</bpmn:incoming>
        <bpmn:startEvent id="Event_0xjcsgj">
          <bpmn:outgoing>Flow_1btcamm</bpmn:outgoing>
        </bpmn:startEvent>
        <bpmn:task id="Activity_12z87n2">
          <bpmn:incoming>Flow_1btcamm</bpmn:incoming>
        </bpmn:task>
        <bpmn:sequenceFlow id="Flow_1btcamm" sourceRef="Event_0xjcsgj" targetRef="Activity_12z87n2" />
      </bpmn:subProcess>
      <bpmn:startEvent id="Event_06k2nch">
        <bpmn:outgoing>Flow_09hzfr3</bpmn:outgoing>
      </bpmn:startEvent>
      <bpmn:sequenceFlow id="Flow_09hzfr3" sourceRef="Event_06k2nch" targetRef="Activity_0moinen" />
    </bpmn:subProcess>
    <bpmn:sequenceFlow id="Flow_07j2lit" sourceRef="StartEvent_1ju4rbo" targetRef="Activity_0vftnjs" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_12phfx4">
      <bpmndi:BPMNEdge id="Flow_07j2lit_di" bpmnElement="Flow_07j2lit">
        <di:waypoint x="364" y="118" />
        <di:waypoint x="364" y="170" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1ju4rbo">
        <dc:Bounds x="346" y="82" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_0vftnjs_di" bpmnElement="Activity_0vftnjs" isExpanded="true">
        <dc:Bounds x="160" y="170" width="610" height="320" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_09hzfr3_di" bpmnElement="Flow_09hzfr3">
        <di:waypoint x="218" y="220" />
        <di:waypoint x="274" y="220" />
        <di:waypoint x="274" y="370" />
        <di:waypoint x="330" y="370" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNShape id="Event_06k2nch_di" bpmnElement="Event_06k2nch">
        <dc:Bounds x="182" y="202" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_0moinen_di" bpmnElement="Activity_0moinen" isExpanded="true">
        <dc:Bounds x="330" y="270" width="350" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1btcamm_di" bpmnElement="Flow_1btcamm">
        <di:waypoint x="406" y="370" />
        <di:waypoint x="470" y="370" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNShape id="Event_0xjcsgj_di" bpmnElement="Event_0xjcsgj">
        <dc:Bounds x="370" y="352" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_12z87n2_di" bpmnElement="Activity_12z87n2">
        <dc:Bounds x="470" y="330" width="100" height="80" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
```

To contrast with process => subprocess => subprocess => only init

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_0esoqrf" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="8.2.0">
    <bpmn:process id="Process_12phfx4" isExecutable="false">
        <bpmn:startEvent id="StartEvent_1ju4rbo">
            <bpmn:outgoing>Flow_07j2lit</bpmn:outgoing>
        </bpmn:startEvent>
        <bpmn:subProcess id="Activity_0vftnjs">
            <bpmn:incoming>Flow_07j2lit</bpmn:incoming>
            <bpmn:subProcess id="Activity_0moinen">
                <bpmn:startEvent id="Event_0xjcsgj" />
            </bpmn:subProcess>
            <bpmn:startEvent id="Event_06k2nch">
                <bpmn:outgoing>Flow_09hzfr3</bpmn:outgoing>
            </bpmn:startEvent>
            <bpmn:sequenceFlow id="Flow_09hzfr3" sourceRef="Event_06k2nch" targetRef="Activity_12z87n2" />
            <bpmn:task id="Activity_12z87n2">
                <bpmn:incoming>Flow_09hzfr3</bpmn:incoming>
            </bpmn:task>
        </bpmn:subProcess>
        <bpmn:sequenceFlow id="Flow_07j2lit" sourceRef="StartEvent_1ju4rbo" targetRef="Activity_0vftnjs" />
    </bpmn:process>
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_12phfx4">
            <bpmndi:BPMNEdge id="Flow_07j2lit_di" bpmnElement="Flow_07j2lit">
                <di:waypoint x="364" y="118" />
                <di:waypoint x="364" y="170" />
            </bpmndi:BPMNEdge>
            <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1ju4rbo">
                <dc:Bounds x="346" y="82" width="36" height="36" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="Activity_0vftnjs_di" bpmnElement="Activity_0vftnjs" isExpanded="true">
                <dc:Bounds x="160" y="170" width="610" height="320" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNEdge id="Flow_09hzfr3_di" bpmnElement="Flow_09hzfr3">
                <di:waypoint x="218" y="220" />
                <di:waypoint x="370" y="220" />
            </bpmndi:BPMNEdge>
            <bpmndi:BPMNShape id="Event_06k2nch_di" bpmnElement="Event_06k2nch">
                <dc:Bounds x="182" y="202" width="36" height="36" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="Activity_12z87n2_di" bpmnElement="Activity_12z87n2">
                <dc:Bounds x="370" y="180" width="100" height="80" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="Activity_0moinen_di" bpmnElement="Activity_0moinen" isExpanded="true">
                <dc:Bounds x="330" y="270" width="350" height="200" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="Event_0xjcsgj_di" bpmnElement="Event_0xjcsgj">
                <dc:Bounds x="370" y="352" width="36" height="36" />
            </bpmndi:BPMNShape>
        </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
</bpmn:definitions>
```

- bpmn:process has the hierarchy
- bpmn:diagrams has the esthetics?

- modelling tool for visual DSL!! https://github.com/webgme/webgme
  - already one exists for state machines. Complex but already exists. Would be good to have a
plugin to exchange format between the two!! That way I don't have to do a tracer myself!.!.!
=> NO! not user-friendly...
