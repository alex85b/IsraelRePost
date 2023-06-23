﻿# IsraelRePost

This project aims to address the inconvenience of scheduling appointments on the 'Israel Post' website. Currently, the website lacks user-friendliness as it lacks a feature to search for "open appointments." Additionally, creating an appointment involves numerous clicks and waiting times.

The solution provided by this project involves the following components:

Backend:

The backend will fetch all available open appointments from 'https://israelpost.co.il/' and store them using Elasticsearch.
It will enable users to query for open appointments within a chosen radius from their location, specifying a specific date and time.
To efficiently calculate distances, the query will leverage Elastic's spatial indexing capabilities.

The frontend aspect of the project will be managed in a separate repository at a later date.
