# Difficulties I faced using coding agents:

1. faced issue in creating multiple steps of same flow in one shot. If it made the complete flow the frontend wont sync with it like states do get updated in the backend but frontend is not showing suitable behavious.

eg. brand paid but pay button is still there of ui although the states of backend changed nearly perfectly, creator able to remove the draft anytime that should not be the case obviously. 


2. when built something wrong once, describing again even a 100 times won't matter. It will always modify the wrongly taken way -> but should think from scratch when i specifically mention. so i have to create big md files and clear context completely.

eg. made a login signup RBAC auth the traditinal way, but later i wanted a in-between onboarding stage rather than directly jumping on to the signup. I had to change my Co-Pilot id and re write md files completely. 


3. It always tries to modify files that were never meant to and things this is the easy route to solve a problem. Changing some other files lead to change the problem statement completely.

eg. It changed my schema at times, I wanted some enums to persist which would have been used in further flow. But to nail down the complexity of my flows to simpler flows it removed the enums completely which harmed the feature I wanted to create.