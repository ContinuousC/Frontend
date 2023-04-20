# [Layers](../src/pages/View.tsx)

Layers are used to visualize info about the items and relation found through discovery. The goal is to be able to go trough to time and find the root cause of our problem.

## Filters and settings

### [Global settings](../src/components/ViewSettings.tsx)

- The topology query limit
- For each visualization format in managed object, you can choose to filter by topology in the global view settings.
- You can choose to filter the grid format by the managed object type (default to false)
- You can choose to include children in the alerts table in managed object tab or managed object details
- Metric prometheus sources: for a managed object type the metrics source for its prometheus item types
  - If in managed object tab, the selected managed object type
  - If in managed object details, its managed object type

### [Time filter](../src/components/DateTimeFilterFull.tsx)

With the timefilter we are able to select a point in a time and a time range. The timefilter has an effect on when particular info of item or relations are shown on the different visualization formats.

## Visualization formats:

### [Topology](../src/components/Topology.tsx)

Herien we visualize the relations between items of different managed object types. We also show the status of the different items and optionally show relevant metrics on relation or items. The topology is based on the point in time.

### [Managed objects](../src/components/ViewItemType.tsx)

We have the [grid view](../src/components/ItemTypeGrid.tsx) to show some metadata about a managed object of different types. You can choose to filter on status or name.

We also have the [table view](../src/components/ItemTypeTable.tsx) to show properties and metrics of a particular managed object type. In contrast to the grid and topology format, we can only show one managed object type.

Lastly we have [charts view](../src/components/DashboardItemType.tsx), to show for one managed object type different type of charts. Mostly the chart will show the top 5 or so of particular expression in prometheus.

The grid and table view are based on the point in time while the charts view are based on the time range.

### [Timeline](../src/components/Timeline.tsx)

Here we can select to visualize the status and properties changes of managed object in binned format. When you click on a bin or the button 'show all changes', a drawer opens to show each change.

### [Alerts table](../src/components/OpenAlertsTable.tsx)

Show open alerts on of all managed object types.

### [Managed object details](../src/components/ItemOverview.tsx)

A detailed overview of the status and properties. Three tabs that show the topology, charts and alerts. Those are similiar to the visualization formats above. You can navigate to this modal by clicking on a managed object in the different visualization formats.
