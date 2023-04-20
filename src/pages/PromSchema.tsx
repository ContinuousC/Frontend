/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useState, useRef, useMemo, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "../types/frontend";
import { components } from "../types/relation-graph-api";
import { shallowEqual } from "fast-equals";
import { useParams } from "react-router-dom";
import axios from "axios";
import { rg } from "../client";

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeItem2, TreeItem2Props, TreeItem2Label } from '@mui/x-tree-view/TreeItem2';
import Popper from "@mui/material/Popper";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from "@mui/material/IconButton";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from '@mui/icons-material/Download';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export function PromSchema(props: { base: string }) {
  return <div className="h-full w-full flex flex-col">
    <div className="mb-1 bg-gray-800">
      <Breadcrumbs maxItems={5} separator="⯈">
        <Link to="/schema">schema</Link>
        <Link to="/schema/prometheus">prometheus</Link>
      </Breadcrumbs>
    </div>
    <div className="flex-1 mb-1 bg-gray-800 overflow-scroll">
      <h1 className="text-xl font-bold pt-2">Prometheus schema</h1>
      <h2 className="my-3 text-lg font-bold">Browse existing schema</h2>
      <ul>
        <li><Link to={props.base + "/tree"}>Tree</Link></li>
        <li><Link to={props.base + "/module"}>Modules</Link></li>
      </ul>
      <h2 className="my-3 text-lg font-bold">Generate schema modules</h2>
      <ul>
        <li><Link to={props.base + "/generate"}>Generate</Link></li>
      </ul>
    </div>
  </div>;
}

export function PromSchemaTree(props: { base: string }) {
  return <Tree
    base={props.base} strip={3}
    baseCrumbs={[
      ["schema", "/schema"],
      ["prometheus", "/schema/prometheus"]
    ]}
    apiBase={"/api/prom-schema"}
    editable={false} />;
}

export function PromSchemaGenerateTree(props: { base: string }) {
  const { module } = useParams();

  if (module === undefined) {
    throw new Error("missing 'module' param");
  }

  return <Tree
    base={props.base + "/generate/" + module}
    strip={5}
    baseCrumbs={[
      ["schema", "/schema"],
      ["prometheus", "/schema/prometheus"],
      ["generate", "/schema/prometheus/generate"],
      [module, "/schema/prometheus/generate/" + module]]}
    apiBase={"/api/prom-schema/generate/" + module}
    editable={true}
    module={module} />;
}

function Tree(props: {
  base: string,
  strip: number,
  baseCrumbs: [string, string][],
  apiBase: string,
  editable: boolean,
  module?: string
}) {
  const queryClient = useQueryClient();
  const path = useLocation().pathname.split("/").slice(props.strip) || [];
  const navigate = useNavigate();
  const { base } = props;

  const [selectedItem, setSelectedItem] = useState<undefined | components["schemas"]["Series"]>(undefined);
  const [selectedFilter, setSelectedFilter] = useState<{ [key: string]: { [label: string]: string } }>({});

  if (props.editable && props.module === undefined) {
    throw new Error("missing module name for editable schema");
  }

  const info = useQuery({
    queryKey: [QueryKey.PromSchemaTree, props.module].concat(path),
    queryFn: async (): Promise<components["schemas"]["TreeInfo"] | components["schemas"]["GenerateTreeInfo"]> => {
      return props.module
        ? await rg.get("/api/prom-schema/generate/{module}/info/tree{path:/.*|$}", {
          path: {
            module: props.module,
            path: path.slice(1) //.map(p => `/${p}`).join("")
          }
        })
        : await rg.get("/api/prom-schema/info/tree{path:/.*|$}", {
          path: {
            path: path.slice(1)
          }
        });
    }
  });

  // Promise<paths["/api/prom-schema/items/tree{path:/.*|$}"]["post"]["responses"]["200"]["content"]["application/json"]>
  const items = useQuery({
    queryKey: [QueryKey.PromSchemaItems, props.module, JSON.stringify(selectedFilter)]
      .concat(path),
    queryFn: async () => {
      setSelectedItem(undefined);
      return props.module
        ? await rg.post("/api/prom-schema/generate/{module}/items/tree{path:/.*|$}", {
          path: {
            module: props.module,
            path: path.slice(1) //.map(p => `/${p}`).join("")
          },
          body: {
            filters: selectedFilter
          }
        })
        : await rg.post("/api/prom-schema/items/tree{path:/.*|$}", {
          path: {
            path: path.slice(1)
          },
          body: {
            filters: selectedFilter
          }
        });
    }
  });

  const metrics = useQuery({
    queryKey: [QueryKey.PromSchemaMetrics, props.module, JSON.stringify(selectedItem)]
      .concat(path),
    queryFn: async () => {
      if (selectedItem !== undefined) {
        return props.module
          ? await rg.post("/api/prom-schema/generate/{module}/metrics/tree{path:/.*|$}", {
            path: {
              module: props.module,
              path: path.slice(1) //.map(p => `/${p}`).join("")
            },
            body: {
              item: selectedItem.keys
            }
          })
          : await rg.post("/api/prom-schema/metrics/tree{path:/.*|$}", {
            path: {
              path: path.slice(1)
            },
            body: {
              item: selectedItem.keys
            }
          });
      }
    },
    enabled: selectedItem !== undefined
  });

  const invalidateQueries = async (path: string[]) => {
    await queryClient.invalidateQueries({
      queryKey: [QueryKey.PromSchemaGenModule, props.module]
    });
    await queryClient.invalidateQueries({
      queryKey: [QueryKey.PromSchemaTree, props.module].concat(path)
    });
    await queryClient.invalidateQueries({
      queryKey: [QueryKey.PromSchemaItems, props.module, JSON.stringify(selectedFilter)]
        .concat(path)
    });
    await queryClient.invalidateQueries({
      queryKey: [QueryKey.PromSchemaMetrics, props.module, JSON.stringify(selectedItem)]
        .concat(path)
    });
  };

  return <div key={path.join("/")} className="h-full w-full flex flex-col">
    <div className="mb-1 bg-gray-800">
      <Breadcrumbs maxItems={5} separator="⯈">
        {props.baseCrumbs.map(([name, link], i) => <span key={i}>
          <Link to={link}>{name}</Link>
        </span>)}
        {path.map((crumb, i) => <span key={i} className="text-nowrap">
          <Link to={base + "/" + path.slice(0, i + 1).join("/")}>
            {crumb}
          </Link>
          {crumb in selectedFilter || items.data && crumb in items.data.path ? <Filter
            data={items.data ? items.data.path[crumb] : undefined}
            selected={selectedFilter[crumb]}
            setSelected={(value) => {
              const newFilter = Object.assign({}, selectedFilter);
              if (value === undefined) {
                delete newFilter[crumb];
              } else {
                newFilter[crumb] = value;
              }
              setSelectedFilter(newFilter);
            }}
          /> : null}
        </span>)}
      </Breadcrumbs>
    </div>
    <div className="flex-1 mb-1 flex flex-row overflow-scroll">
      <div className="flex-[0_0_300px] mr-1 bg-gray-800 overflow-scroll">
        <Outline module={props.module} path={path} />
      </div>
      <div className="flex-1 relative bg-gray-800">
        {info.data && info.data.type === "item" && info.data.errors.length > 0 ?
          <div className="absolute top-1 right-3 z-10 rounded-full bg-gray-500/70">
            <Errors data={info.data.errors} />
          </div> : null}
        <div className="absolute h-full w-full overflow-scroll">
          {info.isLoading && <p>Loading...</p>}
          {info.isError && <p>Error: {info.error.toString()}</p>}
          {(info.data && info.data.type === "item") ? <>

            <h1 className="text-xl font-bold pt-2">
              <Link to={[base].concat(path.slice(0, path.length - 1)).join("/")}>
                <ArrowCircleUpIcon />
              </Link>
              <span> Item: </span>
              {props.editable && path.length > 1 ? <>
                <span>
                  {info.data.name.slice(0, info.data.name.indexOf(':'))}:
                </span>
                <EditableText
                  initValue={info.data.name.slice(info.data.name.indexOf(':') + 1)}
                  value={info.data.name.slice(info.data.name.indexOf(':') + 1)}
                  setValue={async newName => {
                    if (info.data !== undefined && props.module !== undefined) {
                      await rg.put("/api/prom-schema/generate/{module}/rename/{item}", {
                        path: {
                          module: props.module,
                          item: info.data.name.slice(info.data.name.indexOf(':') + 1)
                        },
                        body: {
                          to: newName
                        }
                      });
                      const newPath = path.slice(0, path.length - 1)
                        .concat([info.data.name.slice(0, info.data.name.indexOf(':'))
                          + ":" + newName]);
                      navigate(newPath.slice(1).join("/"));
                      await invalidateQueries(newPath.slice(0, path.length - 1));
                      await invalidateQueries(newPath);
                    }
                  }}
                  validate={/.+/}
                  label="Item name"
                />
              </>
                : <span>{info.data.name}</span>}
            </h1>
            {props.editable && path.length > 1 && "splittable" in info.data ? <>
              <h2 className="my-3 text-lg font-bold">Modify Schema Generation</h2>
              {info.data.splittable.length > 0
                ? <p>
                  <IconButton size="small"
                    onClick={async () => {
                      if (info.data !== undefined && props.module !== undefined) {
                        // TODO
                      }
                    }}
                  >
                    <RestartAltIcon fontSize="small" />
                  </IconButton>
                  Split by value: {
                    info.data.splittable
                      .map(key => info.data !== undefined && "split_by" in info.data
                        && info.data.split_by && <span key={key}>
                          <span> {key}</span>
                          {info.data.split_by.indexOf(key) > -1
                            ? <IconButton size="small"
                              onClick={async () => {
                                if (info.data !== undefined && props.module !== undefined) {
                                  await rg.delete("/api/prom-schema/generate/{module}/split/tree{path:/.*|$}", {
                                    path: {
                                      module: props.module,
                                      path: path.slice(1) //.map(p => `/${p}`).join("")
                                    },
                                    body: {
                                      label: key
                                    }
                                  });
                                  await invalidateQueries(path);
                                }
                              }}>
                              <RemoveCircleIcon fontSize="small" />
                            </IconButton>
                            : <IconButton size="small"
                              onClick={async () => {
                                if (info.data !== undefined && props.module !== undefined) {
                                  await rg.put("/api/prom-schema/generate/{module}/split/tree{path:/.*|$}", {
                                    path: {
                                      module: props.module,
                                      path: path.slice(1) //.map(p => `/${p}`).join("")
                                    },
                                    body: {
                                      label: key
                                    }
                                  });
                                  await invalidateQueries(path);
                                }
                              }}>
                              <AddCircleIcon fontSize="small" />
                            </IconButton>
                          }
                        </span>)}
                </p> : null}
              {<p>
                <IconButton size="small"
                  onClick={async () => {
                    if (info.data !== undefined && props.module !== undefined) {
                      await rg.delete("/api/prom-schema/generate/{module}/choose/tree{path:/.*|$}", {
                        path: {
                          module: props.module,
                          path: path.slice(1)
                        }
                      });
                      await invalidateQueries(path);
                    }
                  }}
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
                Branch on: <EditableChoice
                  choices={info.data.choice.choices}
                  choice={info.data.choice.choice}
                  setChoice={async choice => {
                    if (info.data !== undefined && props.module !== undefined) {
                      await rg.put("/api/prom-schema/generate/{module}/choose/tree{path:/.*|$}", {
                        path: {
                          module: props.module,
                          path: path.slice(1)
                        },
                        body: {
                          choice
                        }
                      });
                      await invalidateQueries(path);
                    }
                  }}
                />
              </p>}
            </> : null}
            <h2 className="my-3 text-lg font-bold">Paths</h2>
            {info.data.paths.map(apath => <div key={apath} className="mb-2 bg-gray-800">
              <Breadcrumbs maxItems={5} separator="⯈">
                {(() => {
                  const elems = apath.split("/").slice(1);
                  return elems.map((elem, i) => {
                    const isCurrent = i === elems.length - 1
                      && path.slice(1).map(elem => `/${elem}`).join("") === apath;
                    return <Link
                      key={elem}
                      to={props.base + "/tree/" + elems.slice(0, i + 1).join("/")}
                      className={isCurrent ? "font-bold" : ""}>
                      {elem}
                    </Link>
                  });
                })()}
              </Breadcrumbs>
            </div>)}
            <Query info={info.data.collected} />
            <Keys info={info.data.collected} />
            <h2 className="my-3 text-lg font-bold">Items</h2>
            <ul className="list-inside list-disc">
              {info.data.items.map((item, i) => <li key={i}>
                <Link to={base + "/" + path.join("/") + "/" + item}>
                  {item}
                </Link>
              </li>)}
            </ul>
            <h2 className="my-3 text-lg font-bold">Metrics</h2>
            {info.data.metrics.length > 0 ? <ul className="list-inside list-disc">
              {info.data.metrics.map((metric, i) => <li key={i}>
                <Link to={base + "/" + path.join("/") + "/" + metric}>{metric}</Link>
              </li>)}
            </ul> : <p>No metrics!</p>}
          </>

            : (info.data && info.data.type === "metric")
              ? <>
                <h1 className="text-xl font-bold">
                  <Link to={[base].concat(path.slice(0, path.length - 1)).join("/")}>
                    <ArrowCircleUpIcon />
                  </Link>
                  <span> Metric: </span>
                  {info.data.name}
                  <span> ({info.data.type})</span>
                </h1>
                <h2 className="my-3 text-lg font-bold">Paths</h2>
                {info.data.paths.map(apath => <div key={apath} className="mb-2 bg-gray-800">
                  <Breadcrumbs maxItems={5} separator="⯈">
                    {(() => {
                      const elems = apath.split("/").slice(1);
                      return elems.map((elem, i) => {
                        const isCurrent = i === elems.length - 1
                          && path.slice(1).map(elem => `/${elem}`).join("") === apath;
                        return <Link
                          key={elem}
                          to={props.base + "/tree/" + elems.slice(0, i + 1).join("/")}
                          className={isCurrent ? "font-bold" : ""}>
                          {elem}
                        </Link>
                      });
                    })()}
                  </Breadcrumbs>
                </div>)}
                <Query info={info.data.collected} />
                <Keys info={info.data.collected} />
              </>
              : null
          }
        </div>
      </div>
    </div>
    <div className="flex-1 mb-1 bg-gray-800 overflow-scroll">
      {items.isLoading && <p>Loading...</p>}
      {items.isError && <p>Error: {items.error.toString()}</p>}
      {items.data ? <ItemsTable data={items.data} setItem={setSelectedItem} /> : null}
    </div>
    {
      selectedItem ? <div className="flex-1 relative mb-1 bg-gray-800">
        <div className="absolute top-1 right-3 z-10 rounded-full bg-gray-500/70">
          <IconButton size="small" onClick={() => setSelectedItem(undefined)}>
            <CloseIcon />
          </IconButton>
        </div>
        {metrics.data && metrics.data.errors.length > 0
          ? <div className="absolute top-1 right-12 z-10 rounded-full bg-gray-500/70">
            <Errors data={metrics.data.errors} />
          </div> : null}
        {metrics.isLoading && <p>Loading...</p>}
        {metrics.isError && <p>Error: {metrics.error.toString()}</p>}
        {metrics.data ? <div className="absolute h-full w-full overflow-scroll">
          <MetricsTable data={metrics.data} />
        </div> : null}
      </div> : null
    }
  </div >;
}

function Errors(props: { data: string[] }) {
  const spanAnchor = useRef(null);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const open = anchor !== null;
  const handleOpen = (_event: React.MouseEvent<HTMLElement>) =>
    open ? setAnchor(null) : setAnchor(spanAnchor.current);
  const handleClose = () => setAnchor(null);

  return <ClickAwayListener onClickAway={handleClose}>
    <span ref={spanAnchor}>
      <Tooltip title={`${props.data.length} error(s)`}>
        <IconButton
          size="small"
          onClick={handleOpen}>
          <ErrorOutlineIcon />
        </IconButton>
      </Tooltip>
      <Popper
        anchorEl={anchor}
        open={open}
        className="w-96 h-96 z-50">
        <Paper className="p-1 border h-full w-full overflow-scroll">
          <div className="absolute top-1 right-1 z-10 rounded-full bg-gray-500/70">
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </div>
          <ul className="ml-5 list-outside list-disc">
            {props.data.map((error, i) => <li key={i}>{error}</li>)}
          </ul>
        </Paper>
      </Popper>
    </span>
  </ClickAwayListener>;
}

export function Outline(props: {
  module: string | undefined,
  path: string[]
}) {

  const tree = useQuery({
    queryKey: [QueryKey.PromSchemaTree, props.module],
    queryFn: async () => {
      if (props.module === undefined) {
        return await rg.get("/api/prom-schema/tree");
      } else {
        return await rg.get("/api/prom-schema/generate/{module}/tree", {
          path: {
            module: props.module
          }
        });
      }
    }
  });

  function getExpandedItems(path: string[], items: components["schemas"]["Node"][]): string[] {
    return items
      .filter(item => item.label === "root:root" || path.indexOf(item.label) >= 0)
      .flatMap(item => [item.id].concat(getExpandedItems(path, item.children || [])));
  }

  function getLinks(base: string, items: components["schemas"]["Node"][]): [string, string][] {
    return items.flatMap(item => {
      const link = `${base}/${item.label === "root:root" ? 'tree' : item.label}`;
      return [[item.id, link] as [string, string]].concat(getLinks(link, item.children || []))
    });
  }

  const base = props.module === undefined ? '/schema/prometheus' : `/schema/prometheus/generate/${props.module}`;
  const expandedItems = useMemo(() => getExpandedItems(props.path.slice(1), tree.data || []), [tree.data, props.path]);
  const links = useMemo(() => Object.fromEntries(getLinks(base, tree.data || [])), [tree.data, base]);

  return <RichTreeView
    items={tree.data || []}
    expandedItems={expandedItems}
    slots={{ item: CustomTreeItem }}
    slotProps={{ item: { path: props.path, links } as any }}
  />;
}

function CustomTreeItem(props: TreeItem2Props & { path?: string[], links?: { [id: string]: string } }) {
  return <TreeItem2 {...props}
    slots={{ label: CustomLabel }}
    slotProps={{ label: { path: props.path, links: props.links, itemId: props.itemId } as any }} />;
}

function CustomLabel({ path, links, itemId, children, ...props }: { children: string, itemId: string, path: string[], links: { [id: string]: string } }) {
  const elemRef = useRef<HTMLDivElement | null>(null);
  const [focussed, setFocussed] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (children === path[path.length - 1] && focussed !== children && elemRef.current !== null) {
      elemRef.current.scrollIntoView();
      setFocussed(children);
    }
  }, [children, path, elemRef.current]);

  return <TreeItem2Label {...props} ref={elemRef} >
    <Link to={links[itemId]}
      className={(path.length <= 1 && children === "root:root") || path[path.length - 1] === children ? "underline font-bold"
        : children === "root:root" || path.indexOf(children) >= 0 ? "underline"
          : ""}>
      {children}
    </Link>
  </TreeItem2Label>;
}

export function PromSchemaModules(props: { base: string }) {
  const info = useQuery({
    queryKey: [QueryKey.PromSchemaModules],
    queryFn: async () => {
      return await rg.get("/api/prom-schema/info/module");
    }
  });

  return <div className="h-full w-full flex flex-col">
    <div className="mb-1 bg-gray-800">
      <Breadcrumbs maxItems={5} separator="⯈">
        <Link to="/schema">schema</Link>
        <Link to="/schema/prometheus">prometheus</Link>
        <Link to="/schema/prometheus/module">modules</Link>
      </Breadcrumbs>
    </div>
    <div className="flex-1 mb-1 bg-gray-800 overflow-scroll">
      {info.isLoading && <p>Loading...</p>}
      {info.isError && <p>Error: {info.error.toString()}</p>}
      {info.data ? <>
        <h1 className="text-xl font-bold">Modules</h1>
        <ul className="list-inside list-disc">
          {Object.entries(info.data).map(([module, version]) => <li key={module}>
            <Link to={props.base + "/module/" + module}>{module}</Link> (v{version})
          </li>)}
        </ul>
      </> : null}
    </div>
  </div>;
}

export function PromSchemaModule(props: { base: string }) {
  const { module } = useParams();

  if (module === undefined) {
    throw new Error("missing 'module' param");
  }

  const info = useQuery({
    queryKey: [QueryKey.PromSchemaModule, module],
    queryFn: async () => {
      return await rg.get("/api/prom-schema/info/module/{mod:[^/]+}", {
        path: {
          mod: module
        }
      });
    }
  });

  return <div className="h-full w-full flex flex-col">
    <div className="mb-1 bg-gray-800">
      <Breadcrumbs maxItems={5} separator="⯈">
        <Link to="/schema">schema</Link>
        <Link to="/schema/prometheus">prometheus</Link>
        <Link to="/schema/prometheus/module">modules</Link>
        <Link to={`/schema/prometheus/module/${module}`}>{module}</Link>
      </Breadcrumbs>
    </div>
    <div className="flex-1 mb-1 bg-gray-800 overflow-scroll">
      {info.isLoading && <p>Loading...</p>}
      {info.isError && <p>Error: {info.error.toString()}</p>}
      {info.data ? <>
        <h1 className="text-xl font-bold">Module {module}</h1>
        <h2 className="my-3 text-lg font-bold">Requires</h2>
        <ul className="list-inside list-disc">
          {Object.entries(info.data.requires).length === 0
            ? <p>No requires!</p>
            : Object.entries(info.data.requires).map(([mod, req]) => <li key={mod}>
              <Link to={props.base + "/module/" + mod}>{mod}</Link> ({req})
            </li>)}
        </ul>
        <h2 className="my-3 text-lg font-bold">Items</h2>
        <ul className="list-inside list-disc">
          {info.data.items.map(item => <li key={item}>
            <Link to={props.base + "/module/" + module + "/" + item}>{item}</Link>
          </li>)}
        </ul>
      </> : null}
    </div>
  </div >;
}

export function PromSchemaItem(props: { base: string }) {
  const { module, item } = useParams();

  if (module === undefined) {
    throw new Error("missing 'module' param");
  }

  if (item === undefined) {
    throw new Error("missing 'item' param");
  }

  const info = useQuery({
    queryKey: [QueryKey.PromSchemaItem, module, item],
    queryFn: async () => {
      return await rg.get("/api/prom-schema/info/item/{item:[^/:]+:[^/]+}",
        {
          path: { item: module + ":" + item }
        });
    }
  });

  return <div className="h-full w-full flex flex-col">
    <div className="mb-1 bg-gray-800">
      <Breadcrumbs maxItems={5} separator="⯈">
        <Link to="/schema">schema</Link>
        <Link to="/schema/prometheus">prometheus</Link>
        <Link to="/schema/prometheus/module">modules</Link>
        <Link to={`/schema/prometheus/module/${module}`}>{module}</Link>
        <Link to={`/schema/prometheus/module/${module}/${item}`}>{item}</Link>
      </Breadcrumbs>
    </div>
    <div className="flex-1 mb-1 bg-gray-800 overflow-scroll">
      {info.isLoading && <p>Loading...</p>}
      {info.isError && <p>Error: {info.error.toString()}</p>}
      {info.data
        ? <>
          <h1 className="text-xl font-bold">Item {module}:{item}</h1>
          <h2 className="my-3 text-lg font-bold">Paths</h2>
          {info.data.paths.length === 0
            ? <p> No paths found!</p>
            : info.data.paths.map(path => <div key={path} className="mb-2 bg-gray-800">
              <Breadcrumbs maxItems={5} separator="⯈">
                {(() => {
                  const elems = path.split("/").slice(1);
                  return elems.map((elem, i) => <Link
                    key={elem}
                    to={props.base + "/tree/" + elems.slice(0, i + 1).join("/")}>
                    {elem}
                  </Link>);
                })()}
              </Breadcrumbs>
            </div>)}
          <h2 className="my-3 text-lg font-bold">Query</h2>
          {Object.entries(info.data.query).length === 0 ?
            <p>No query!</p>
            : <ul className="ml-5 list-inside list-disc">
              {Object.entries(info.data.query).map(([label, selector]) => <li key={label}>
                {label}: {JSON.stringify(selector)}
              </li>)}
            </ul>}
          <h2 className="my-3 text-lg font-bold">Keys</h2>
          {info.data.keys.length === 0 ?
            <p>No keys!</p>
            : <ul className="ml-5 list-inside list-disc">
              {info.data.keys.map(key => <li key={key}>{key}</li>)}
            </ul>}
          <h2 className="my-3 text-lg font-bold">Items</h2>
          {info.data.items.length === 0 ?
            <p>No items!</p>
            : <ul className="ml-5 list-inside list-disc">
              {info.data.items.map(item => <li key={item}>
                <Link to={props.base + "/module/" + item.replace(':', '/')}>{item}</Link>
              </li>)}
            </ul>}
          <h2 className="my-3 text-lg font-bold">Metrics</h2>
          {info.data.metrics.length === 0 ?
            <p>No metrics</p>
            : <ul className="list-inside list-disc">
              {info.data.metrics.map(metric => <li key={metric}>
                {metric}
              </li>)}
            </ul>}
        </>
        : null}
    </div>
  </div>;
}

export function PromSchemaGenerateModules(props: { base: string }) {

  const queryClient = useQueryClient();

  const modules = useQuery({
    queryKey: [QueryKey.PromSchemaGenModules],
    queryFn: async (): Promise<string[]> => {
      return await rg.get("/api/prom-schema/generate");
    }
  });

  return <div className="h-full w-full flex flex-col">
    <div className="mb-1 bg-gray-800">
      <Breadcrumbs maxItems={5} separator="⯈">
        <Link to="/schema">schema</Link>
        <Link to="/schema/prometheus">prometheus</Link>
        <Link to="/schema/prometheus/generate">generate</Link>
      </Breadcrumbs>
    </div>
    <div className="flex-1 mb-1 bg-gray-800 overflow-scroll">
      {modules.isLoading && <p>Loading...</p>}
      {modules.isError && <p>Error: {modules.error.toString()}</p>}
      {modules.data !== undefined ? <>
        <h1 className="mb-3 text-xl font-bold">Generate modules</h1>
        <PromSchemaGenerateModulesList
          base={props.base}
          modules={modules.data}
          reload={async () => {
            await queryClient.invalidateQueries({
              queryKey: [QueryKey.PromSchemaGenModules]
            });
          }}
        />
      </> : null}
    </div>
  </div>;
}

export function PromSchemaGenerateModulesList(props: {
  base: string,
  modules: string[],
  reload: () => void
}) {
  const [nextKey, setNextKey] = useState(() => props.modules.length);
  const [newModules, setNewModules] = useState<[number, string | undefined][]>(() => props.modules.map((mod, i) => [i, mod]));

  return <ul>
    {newModules.map(([key, name], i) => <li key={key}>
      <IconButton
        size="small"
        onClick={async (_ev) => {
          if (name !== undefined) {
            setNewModules(newModules.slice(0, i).concat(newModules.slice(i + 1)));
            await rg.delete("/api/prom-schema/generate/{module}", {
              path: { module: name }
            });
            props.reload();
          }
        }}>
        <RemoveCircleIcon fontSize="small" />
      </IconButton>
      <EditableText
        label="Module name"
        empty="New module"
        validate={/^[A-Za-z][A-Za-z0-9-]*$/}
        initValue={name}
        value={name !== undefined && props.modules.indexOf(name) > -1 ? name : undefined}
        setValue={async newName => {
          setNewModules(newModules.slice(0, i)
            .concat([[key, newName]])
            .concat(newModules.slice(i + 1)));
          if (name === undefined) {
            await rg.put("/api/prom-schema/generate/{module}", { path: { module: newName } });
          } else {
            await rg.post("/api/prom-schema/generate/{module}/rename", {
              path: {
                module: name
              },
              body: {
                to: newName
              }
            });
          }
          props.reload();
        }}
      />
      {name !== undefined ? <>
        <span> </span>
        <Link to={props.base + "/generate/" + name}>
          <FileOpenIcon fontSize="small" />
        </Link>
      </> : null}
    </li>)}
    <li>
      <IconButton size="small"
        onClick={(_ev) => {
          setNewModules(newModules.concat([[nextKey, undefined]]));
          setNextKey(nextKey + 1);
        }}>
        <AddCircleIcon fontSize="small" />
      </IconButton>
    </li>
  </ul>;
}

export function PromSchemaGenerateModule(props: { base: string }) {

  const { module } = useParams();

  if (module === undefined) {
    throw new Error("missing 'module' param");
  }

  const queryClient = useQueryClient();
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [newQuery, setNewQuery] = useState<MetricSelector | undefined>(undefined);
  const updateNewQuery = useRef<((newValue: MetricSelector) => void) | undefined>(undefined);

  const info = useQuery({
    queryKey: [QueryKey.PromSchemaGenModule, module],
    queryFn: async () => {
      return await rg.get("/api/prom-schema/generate/{module}", { path: { module } });
    }
  });

  /* :-/ */
  if (newQuery === undefined && info.data && info.data.metrics) {
    setNewQuery(info.data.metrics.query);
  }

  const common_by_presence = useMemo(() =>
    info.data && info.data.metrics && newQuery
      ? info.data.metrics.common_by_presence.filter(label => !(label in newQuery))
      : [], [info.data, info.data?.metrics, newQuery]);
  const common_by_value = useMemo(() =>
    info.data && info.data.metrics && newQuery
      ? Object.entries(info.data.metrics.common_by_value)
        .filter(([label, _value]) => !(label in newQuery))
      : [], [info.data, info.data?.metrics, newQuery]);

  return <div className="h-full w-full flex flex-col">
    <div className="mb-1 bg-gray-800">
      <Breadcrumbs maxItems={5} separator="⯈">
        <Link to="/schema">schema</Link>
        <Link to="/schema/prometheus">prometheus</Link>
        <Link to="/schema/prometheus/generate">generate</Link>
        <Link to={`/schema/prometheus/generate/${module}`}>{module}</Link>
      </Breadcrumbs>
    </div>
    <div className="flex-1 mb-1 bg-gray-800 overflow-scroll">
      <h1 className="text-xl font-bold">Generate module: {module}</h1>
      <h2 className="my-3 text-lg font-bold">
        Query
        {info.data && newQuery && (!info.data.metrics
          || !metricSelectorEq(info.data.metrics.query, newQuery))
          ? <IconButton size="small"
            onClick={async (_ev) => {
              setMetricsLoading(true);
              await rg.post("/api/prom-schema/generate/{module}/metrics", {
                path: { module },
                body: {
                  query: newQuery,
                  force: false,
                }
              });
              setMetricsLoading(false);
              await queryClient.invalidateQueries({
                queryKey: [QueryKey.PromSchemaGenModule, module]
              });
            }}>
            <ChangeCircleIcon />
          </IconButton>
          : null}
      </h2>
      {info.isLoading && <p>Loading...</p>}
      {info.isError && <p>Error: {info.error.toString()}</p>}
      {info.data !== undefined
        ? <EditableMetricSelector
          initValue={info.data.metrics ? info.data.metrics.query : {}}
          value={info.data.metrics ? info.data.metrics.query : {}}
          setValue={setNewQuery}
          updateValue={updateNewQuery} />
        : null}

      <h2 className="my-3 text-lg font-bold">
        Metrics
        {info.data ? <>
          <span> </span>
          <a href={"/api/prom-schema/generate/" + module + "/metrics/download"}>
            <DownloadIcon />
          </a>
        </> : null}
      </h2>
      {info.isLoading || metricsLoading && <p>Loading...</p>}
      {info.isError && <p>Error: {info.error.toString()}</p>}
      {info.data && !metricsLoading
        ? !info.data.metrics
          ? <p>Not yet defined!</p>
          : <>
            <p>Loaded {info.data.metrics.nseries} series
              at {info.data.metrics.time}.</p>
            {common_by_presence.length > 0 || common_by_value.length > 0 ? <>
              <p>Common labels:</p>
              <ul className="list-inside list-disc">
                {common_by_presence.length > 0 ? <li>
                  <span>By presence: </span>
                  {common_by_presence.map((label, i) => <span key={label}>
                    {(i > 0) ? <span>, </span> : null}
                    <span>{label}</span>
                    <IconButton size="small"
                      onClick={(_ev) => {
                        if (updateNewQuery.current !== undefined) {
                          updateNewQuery.current(Object.fromEntries(Object.entries(newQuery || {})
                            .concat([[label, "set"]])));
                        }
                      }}>
                      <AddCircleIcon />
                    </IconButton>
                  </span>)}
                </li> : null}
                {common_by_value.length > 0 ? <li>
                  <span>By value: </span>
                  {common_by_value.map(([label, value], i) => <span key={label}>
                    {(i > 0) ? <span>, </span> : null}
                    <span>{label}={value}</span>
                    <IconButton size="small"
                      onClick={(_ev) => {
                        if (updateNewQuery.current !== undefined) {
                          updateNewQuery.current(Object.fromEntries(Object.entries(newQuery || {})
                            .concat([[label, { "eq": value || "" }]])));
                        }
                      }}>
                      <AddCircleIcon />
                    </IconButton>
                  </span>)}
                </li> : null}
              </ul>
            </> : null}
          </>
        : null}

      <h2 className="my-3 text-lg font-bold">
        Hints
        {info.data ? <>
          <span> </span>
          <a href={"/api/prom-schema/generate/" + module + "/hints/download"}>
            <DownloadIcon />
          </a>
        </> : null}
      </h2>
      {info.isLoading && <p>Loading...</p>}
      {info.isError && <p>Error: {info.error.toString()}</p>}
      {info.data ? <>
        <h3 className="my-3 text-base font-bold">Renames</h3>
        {Object.entries(info.data.hints.rename || {}).length === 0
          ? <p>No renames</p> : <ul className="list-inside list-disc">
            {Object.entries(info.data.hints.rename || {})
              .map(([name, paths]) => <li key={name}>
                <IconButton size="small"
                  onClick={async (_ev) => {
                    await rg.delete("/api/prom-schema/generate/{module}/rename/{item}", {
                      path: {
                        module,
                        item: name
                      }
                    });
                    await queryClient.invalidateQueries({
                      queryKey: [QueryKey.PromSchemaGenModule, module]
                    });
                  }}>
                  <RemoveCircleIcon />
                </IconButton>
                <span>{name}: </span>
                <ul className="ml-5 list-inside list-disc">{(paths || []).map((path, i) => <li key={i}>{
                  metricSelectorToPromExpr(path)
                }</li>)}</ul>
              </li>)}
          </ul>}
        <h3 className="my-3 text-base font-bold">Split by labels</h3>
        {(info.data.hints.split_by || []).length === 0
          ? <p>No splits</p> : <ul>
            {Object.entries(info.data.hints.split_by || [])
              .map(([i, split]) => <li key={i}>
                <IconButton size="small"
                  onClick={async (_ev) => {
                    await rg.delete("/api/prom-schema/generate/{module}/split/query", {
                      path: {
                        module
                      },
                      body: {
                        label: split.label,
                        query: split.query
                      }
                    });
                    await queryClient.invalidateQueries({
                      queryKey: [QueryKey.PromSchemaGenModule, module]
                    });
                  }}>
                  <RemoveCircleIcon />
                </IconButton>
                {split.label}: {metricSelectorToPromExpr(split.query)}
              </li>)}
          </ul>}
      </> : null}

      <h2 className="my-3 text-lg font-bold">
        Schema
        {info.data && info.data.schema ? <>
          <span> </span>
          <a href={"/api/prom-schema/generate/" + module + "/download"}>
            <DownloadIcon />
          </a>
        </> : null}
      </h2>
      {info.isLoading || metricsLoading && <p>Loading...</p>}
      {info.isError && <p>Error: {info.error.toString()}</p>}
      {info.data && !metricsLoading
        ? !info.data.schema
          ? <p>Not yet generated!</p>
          : <>
            <p>Generated {info.data.schema.nitems} items.</p>
            <p>
              <span>Root: </span>
              <Link to={props.base + "/generate/" + module + "/tree/"
                + module + ":" + info.data.schema.root}>
                {module}:{info.data.schema.root}
              </Link>
            </p>
          </>
        : null}

    </div>
  </div >;
}


type MetricSelector = components["schemas"]["MetricSelector"];
type LabelSelector = components["schemas"]["LabelSelector"];
//type MetricSelectorState = [TextState, LabelSelectorState][];

function metricSelectorEq(a: MetricSelector, b: MetricSelector): boolean {
  return Object.entries(a).length === Object.entries(b).length
    && Object.entries(a).every(([label, selector]) =>
      label in b && labelSelectorEq(selector || "opt", b[label] || "opt")
    );
}

function labelSelectorEq(a: LabelSelector, b: LabelSelector): boolean {
  return typeof a === "string" || typeof b === "string" ? a === b
    : "eq" in a ? "eq" in b && a["eq"] === b["eq"]
      : "ne" in a ? "ne" in b && a["ne"] === b["ne"]
        : "in" in a ? "in" in b && stringSetEq(a["in"], b["in"])
          : "not_in" in a ? "not_in" in b && stringSetEq(a["not_in"], b["not_in"])
            : false;
}

function stringSetEq(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every(key => b.indexOf(key) > -1);
}


function metricSelectorToPromExpr(s: MetricSelector): string {
  return `{${Object.entries(s).map(([label, selector]) => ` ${label} ${labelSelectorToPromExpr(selector || "opt")}`).join(",")} }`;
}

function labelSelectorToPromExpr(s: LabelSelector): string {
  return s === "opt" ? `=~ ".*"`
    : s === "set" ? `!= ""`
      : s === "unset" ? `= ""`
        : "eq" in s ? `= ${JSON.stringify(s.eq)}`
          : "ne" in s ? `!= ${JSON.stringify(s.ne)}`
            : "in" in s ? `=~ "${s.in.map(escapeRegex).join("|")}"`
              : /* "not_in" in s ? */ `!~ "${s.not_in.map(escapeRegex).join("|")}"`;
}

// Existing function?
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&');
}


function EditableMetricSelector(props: {
  initValue: MetricSelector | undefined,
  value: MetricSelector | undefined,
  setValue: (newValue: MetricSelector) => void,
  updateValue: React.MutableRefObject<((newValue: MetricSelector) => void) | undefined>
}) {
  type Value = [number, string | undefined, LabelSelector | undefined];
  const [nextKey, setNextKey] = useState(() => props.initValue !== undefined ? Object.entries(props.initValue).length : 0);
  const [values, setValues] = useState<Value[]>(
    () => Object.entries(props.initValue || {}).map(([label, selector], i) => [i, label, selector]));

  props.updateValue.current = (newValue: MetricSelector) => {
    const curEntries = values.filter(([_key, label, _selector]) => label !== undefined && label in newValue)
      .map(([key, label, _selector]): Value => [key, label, newValue[label || ""]]);
    const newEntries = Object.entries(newValue)
      .filter(([label, _selector]) => !values.some(([_key, other, _selector]) => label === other))
      .map(([label, selector], i): Value => [nextKey + i, label, selector]);
    setValues(curEntries.concat(newEntries));
    setNextKey(nextKey + newEntries.length);
    props.setValue(newValue);
  };

  const queries = useMemo(() => values.map((_, i) => {
    const query = Object.fromEntries(values.slice(0, i).concat(values.slice(i + 1))
      .flatMap(([_, label, selector]) => label && selector !== undefined
        ? [[label, selector]] : []));
    return Object.entries(query).some(([_label, selector]) => selector === "opt" ? false
      : selector === "set" ? true
        : selector === "unset" ? false
          : "eq" in selector ? selector.eq !== ""
            : "ne" in selector ? selector.ne === ""
              : "in" in selector ? selector.in.length > 0 && selector.in.every(v => v !== "")
                : selector.not_in.some(v => v === ""))
      ? metricSelectorToPromExpr(query) : undefined;
  }), [values]);
  const update = (newValues: [number, string | undefined, LabelSelector | undefined][]) => {
    setValues(newValues);
    props.setValue(Object.fromEntries(newValues.map(([_, label, selector]) => [label, selector])))
  };

  return <>
    <p>Labels:</p>
    <ul>
      {values.map(([key, label, selector], i) => <li key={key}>
        <IconButton size="small"
          onClick={(_ev) => update(values.slice(0, i)
            .concat(values.slice(i + 1)))
          }>
          <RemoveCircleIcon />
        </IconButton>
        <EditableLabelName
          query={queries[i]}
          value={label && props.value && label in props.value ? label : undefined}
          setValue={(newLabel) => {
            const [key, _label, selector] = values[i];
            update(values.slice(0, i)
              .concat([[key, newLabel, selector]])
              .concat(values.slice(i + 1)));
          }}
          initValue={label} />
        <span> </span>
        <EditableLabelSelector
          label={label}
          query={queries[i]}
          initValue={selector}
          value={label && props.value && label in props.value ? props.value[label] : undefined}
          setValue={(newSelector) => {
            const [key, label, _selector] = values[i];
            update(values.slice(0, i)
              .concat([[key, label, newSelector]])
              .concat(values.slice(i + 1)));
          }} />
      </li>)}
      <li>
        <IconButton size="small"
          onClick={(_ev) => {
            setValues(values.concat([[nextKey, undefined, "set"]]))
            setNextKey(nextKey + 1);
          }}>
          <AddCircleIcon />
        </IconButton>
      </li>
    </ul>
  </>;
}

/* function loadMetricSelector(query: MetricSelector): MetricSelectorState {
 *   return Object.entries(query).map(([label, selector]) => [loadLabelName(label), loadLabelSelector(selector)]);
 * }
    *
    * function saveMetricSelector(state: MetricSelectorState): MetricSelector {
 *   return Object.fromEntries(state.map(([label, selector]) => [saveLabelName(label), saveLabelSelector(selector)]));
 * } */

/* type TextState = {value: string, editing: boolean }; */

function EditableLabelName(props: {
  query: string | undefined,
  initValue: string | undefined,
  value: string | undefined,
  setValue: (newValue: string) => void,
}) {
  const allLabels = useQuery({
    queryKey: [QueryKey.GetPromLabels],
    queryFn: async (): Promise<{ status: "success", data: string[] }
      | { status: "error", errorType: string, error: string }> => {
      const res = await axios.get("/api/prom/api/v1/labels");
      return res.data;
    }
  });

  const possibleLabels = useQuery({
    queryKey: [QueryKey.GetPromLabels, props.query],
    queryFn: async (): Promise<{ status: "success", data: string[] }
      | { status: "error", errorType: string, error: string } | null> => {
      if (props.query !== undefined) {
        const res = await axios.get("/api/prom/api/v1/labels", {
          params: {
            "match[]": props.query
          }
        });
        return res.data;
      } else {
        return null;
      }
    }
  });

  return <EditableText
    initValue={props.initValue}
    value={props.value}
    setValue={props.setValue}
    label="Label name"
    validate={/^[a-zA-Z_][a-zA-Z0-9_]*$/}
    options={possibleLabels.data && possibleLabels.data.status === "success" ? possibleLabels.data.data
      : allLabels.data && allLabels.data.status === "success" ? allLabels.data.data : undefined}
  />
}

function EditableLabelValue(props: {
  label: string | undefined,
  query: string | undefined,
  initValue: string | undefined,
  value: string | undefined,
  setValue: (newValue: string) => void,
}) {
  const allValues = useQuery({
    queryKey: [QueryKey.GetPromLabelValues, props.label],
    queryFn: async (): Promise<{ status: "success", data: string[] }
      | { status: "error", errorType: string, error: string } | null> => {
      if (props.label !== undefined) {
        const res = await axios.get("/api/prom/api/v1/label/" + props.label + "/values");
        return res.data;
      } else {
        return null;
      }
    }
  });

  const possibleValues = useQuery({
    queryKey: [QueryKey.GetPromLabelValues, props.label, props.query],
    queryFn: async (): Promise<{ status: "success", data: string[] }
      | { status: "error", errorType: string, error: string } | null> => {
      if (props.label !== undefined && props.query !== undefined) {
        const res = await axios.get("/api/prom/api/v1/label/" + props.label + "/values", {
          params: {
            "match[]": props.query
          }
        });
        return res.data;
      } else {
        return null;
      }
    }
  });

  return <EditableText
    initValue={props.initValue}
    value={props.value}
    setValue={props.setValue}
    label="Label value"
    validate={/^.*$/}
    options={possibleValues.data && possibleValues.data.status === "success" ? possibleValues.data.data
      : allValues.data && allValues.data.status === "success" ? allValues.data.data : undefined}
  />
}

function EditableText(props: {
  initValue: string | undefined,
  value: string | undefined,
  setValue: (newValue: string) => void,
  options?: string[] | undefined,
  validate: RegExp,
  label: string,
  empty?: string
}) {
  const [value, setValue] = useState(props.initValue || "");
  const [editing, setEditing] = useState(false);

  const validate = (value: string): boolean =>
    value.match(props.validate) !== null;
  const error = !validate(value);
  const updated = value !== props.value;

  const finishEditing = () => {
    setEditing(false);
    if (!error) {
      props.setValue(value);
    }
  };

  return editing
    ? <ClickAwayListener onClickAway={finishEditing}>
      {props.options !== undefined
        ? <Autocomplete
          size="small"
          value={value}
          options={props.options}
          freeSolo
          sx={{ width: 200, display: "inline-block" }}
          renderInput={(params) => <TextField {...params}
            label={props.label + (updated ? " (changed)" : "")}
            placeholder={props.label}
            error={error}
            autoFocus
            onChange={(ev) => setValue(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                finishEditing();
              }
            }}
          />}
          onChange={(_ev, value) => setValue(value || "")}
        />
        : <TextField
          size="small"
          label={props.label + (updated ? " (changed)" : "")}
          placeholder={props.label}
          value={value}
          error={error}
          autoFocus
          onChange={(ev) => setValue(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              finishEditing();
            }
          }} />}
    </ClickAwayListener>
    : <span
      className={error ? "text-red-500" : updated ? "italic" : ""}
      onClick={(_ev) => setEditing(true)}>
      {value || <i>({props.empty || props.label})</i>}
    </span>;
}

function EditableLabelSelector(props: {
  label: string | undefined,
  query: string | undefined,
  initValue: LabelSelector | undefined,
  value: LabelSelector | undefined,
  setValue: (newValue: LabelSelector) => void
}) {
  interface Tags {
    opt: "none"; set: "none"; unset: "none";
    eq: "value"; ne: "value";
    in: "values"; not_in: "values"
  };
  const tags: Tags = {
    "opt": "none",
    "set": "none",
    "unset": "none",
    "eq": "value",
    "ne": "value",
    "in": "values",
    "not_in": "values"
  };

  function splitLabelSelector(selector: LabelSelector): [keyof Tags, string | undefined, string[] | undefined] {
    return typeof selector === "string" ? [selector, undefined, undefined]
      : "eq" in selector ? ["eq", selector.eq, undefined]
        : "ne" in selector ? ["ne", selector.ne, undefined]
          : "in" in selector ? ["in", undefined, selector.in]
            : ["not_in", undefined, selector.not_in];
  }

  const [initTag, initValue, initValues]: [keyof Tags | undefined, string | undefined, string[] | undefined] = useMemo(() =>
    props.initValue === undefined ? [undefined, undefined, undefined] : splitLabelSelector(props.initValue), []);
  const [currentTag, currentValue, currentValues]: [keyof Tags | undefined, string | undefined, string[] | undefined] = useMemo(() =>
    props.value === undefined ? [undefined, undefined, undefined] : splitLabelSelector(props.value), [props.value]);
  const [tag, setTag] = useState<keyof Tags>(initTag || "opt");
  const [value, setValue] = useState(initValue || "");
  const [values, setValues] = useState(initValues || []);
  const [editing, setEditing] = useState(false);
  const tagUpdated = tag !== currentTag;

  const finishEditing = (tag: keyof Tags, value: string, values: string[]) => {
    props.setValue(tags[tag] === "none" ? tag as LabelSelector
      : tags[tag] === "value" ? { [tag]: value } as LabelSelector
        : { [tag]: values } as LabelSelector);
  };

  return <>
    {editing
      ? <ClickAwayListener onClickAway={(_ev) => {
        setEditing(false);
      }}>
        <Select
          size="small"
          value={tag}
          autoFocus
          MenuProps={{ disablePortal: true }}
          onChange={(ev) => {
            const newTag = ev.target.value as keyof Tags;
            setTag(newTag);
            finishEditing(newTag, value, values);
          }}>
          {Object.keys(tags).map(tag => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
        </Select>
      </ClickAwayListener >
      : <span className={tagUpdated ? "italic" : ""}
        onClick={(_ev) => setEditing(true)}>
        {tag}
      </span>}
    {tags[tag] === "value" ? <>
      <span> </span>
      <EditableLabelValue
        label={props.label}
        query={props.query}
        initValue={value}
        value={currentValue}
        setValue={(newValue) => {
          const newValues = [newValue];
          setValue(newValue);
          setValues(newValues);
          finishEditing(tag, newValue, newValues);
        }} />
    </>
      : tags[tag] === "values" ? <>
        <span> </span>
        <EditableLabelValues
          label={props.label}
          query={props.query}
          initValue={values}
          value={currentValues}
          setValue={(newValues) => {
            setValues(newValues);
            finishEditing(tag, value, newValues);
          }} />
      </>
        : null
    }
  </>;
}

function EditableLabelValues(props: {
  label: string | undefined,
  query: string | undefined,
  initValue: string[] | undefined,
  value: string[] | undefined,
  setValue: (newValue: string[]) => void
}) {
  const [nextKey, setNextKey] = useState(() => props.initValue !== undefined ? props.initValue.length : 0);
  const [values, setValues] = useState<[number, string][]>(() => (props.initValue || []).map((value, i) => [i, value]));
  const update = (newValues: [number, string][]) => {
    setValues(newValues);
    props.setValue(newValues.map(([_key, value]) => value));
  };

  return <span className="inline-block align-top">
    {values.map(([key, value], i) => <span key={key}>
      <IconButton
        size="small"
        onClick={(_ev) => {
          update(values.slice(0, i)
            .concat(values.slice(i + 1)))
        }}>
        <RemoveCircleIcon fontSize="small" />
      </IconButton>
      <EditableLabelValue
        label={props.label}
        query={props.query}
        initValue={value}
        value={props.value && props.value.indexOf(value) > -1 ? value : undefined}
        setValue={newValue => {
          update(values.slice(0, i)
            .concat([[key, newValue]])
            .concat(values.slice(i + 1)))
        }}
      />
      <br /></span>)}
    <IconButton
      size="small"
      onClick={(_ev) => {
        update(values.concat([[nextKey, ""]]));
        setNextKey(nextKey + 1);
      }}>
      <AddCircleIcon fontSize="small" />
    </IconButton>
  </span>;
}

function EditableChoice(props: {
  choices: string[][],
  choice: string[],
  setChoice: (newValue: string[]) => void,
}) {
  const [choice, setChoice] = useState(props.choice);
  const [editing, setEditing] = useState(false);

  return editing
    ? <ClickAwayListener onClickAway={() => setEditing(false)}>
      <Select
        size="small"
        value={choice.join(" - ")}
        autoFocus
        MenuProps={{ disablePortal: true }}
        onChange={(ev) => {
          const newChoice = ev.target.value.split(" - ");
          setChoice(newChoice);
          props.setChoice(newChoice)
        }}>
        {props.choices.map(choice => <MenuItem
          key={choice.join(" - ")}
          value={choice.join(" - ")}
        >{choice.join(" - ")}</MenuItem>)}
      </Select>
    </ClickAwayListener>
    : <span
      onClick={(_ev) => setEditing(true)}>
      {props.choice.join(" - ") === choice.join(" - ")
        ? choice.join(" - ") : <i>{choice.join(" - ")}</i>}
    </span>;
}


function Query(props: { info: components["schemas"]["CollectedInfo"][] }) {
  const queries = props.info.filter(item => Object.keys(item.query).length > 0);
  return <>
    <h2 className="my-3 text-lg font-bold">Query</h2>
    {queries.length > 0 ? <ul className="list-inside list-disc">
      {queries.map(item => <li key={item.elem}>
        {item.elem}: {metricSelectorToPromExpr(item.query)}
      </li>)}
    </ul> : <p>No query!</p>}
  </>;
}

function Keys(props: { info: components["schemas"]["CollectedInfo"][] }) {
  const keys = props.info.filter(item => Object.keys(item.keys).length > 0);
  return <>
    <h2 className="my-3 text-lg font-bold">Keys</h2>
    {keys.length > 0 ? <ul className="list-inside list-disc">
      {keys.map(item => <li key={item.elem}>
        {item.elem}: {item.keys.join(", ")}
      </li>)}
    </ul> : <p>No keys!</p>}
  </>;
}

function Filter(props: {
  data: components["schemas"]["ItemList"] | undefined,
  selected: { [label: string]: string } | undefined,
  setSelected: (value: { [label: string]: string } | undefined) => void
}) {
  const spanAnchor = useRef(null);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const open = Boolean(anchor);
  const handleOpen = (_event: React.MouseEvent<HTMLElement>) =>
    open ? setAnchor(null) : setAnchor(spanAnchor.current);
  const handleClose = () => setAnchor(null);
  const filtered = props.selected !== undefined;

  return <ClickAwayListener onClickAway={handleClose}>
    <span ref={spanAnchor}>
      <Tooltip title="Filter item">
        <span>
          {props.data === undefined ? <CircularProgress size={16} />
            : <IconButton
              size="small"
              onClick={handleOpen}
              color={filtered ? "primary" : "inherit"}
            >
              <FilterAltIcon fontSize="small" />
            </IconButton>}
        </span>
      </Tooltip>
      {props.data === undefined ? null : <Popper
        anchorEl={anchor}
        open={open}
        className="w-96 h-96 z-50">
        <Paper className="p-1 border h-full w-full overflow-scroll">
          <div className="absolute top-1 right-1 z-10 rounded-full bg-gray-500/70">
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#Series</TableCell>
                {props.data.keys.map((label, i) => <TableCell key={i}>
                  {label}
                </TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {props.data.items.map((item, i) => {
                const selected = shallowEqual(item.keys, props.selected);
                return <TableRow key={i}
                  hover
                  selected={selected}
                  onClick={() => {
                    props.setSelected(selected ? undefined : Object.fromEntries(
                      Object.entries(item.keys || {})
                        .map(([k, v]) => [k, v || ""])));
                  }}>
                  <TableCell>{item.count}</TableCell>
                  {props.data !== undefined
                    && props.data.keys.map((label, i) => <TableCell key={i}>
                      {item.keys[label]}
                    </TableCell>)}
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </Paper>
      </Popper>}
    </span>
  </ClickAwayListener >;
}

function ItemsTable(props: {
  data: components["schemas"]["Items"],
  setItem: (value: components["schemas"]["Series"] | undefined) => void
}
) {
  const cols = props.data.cols.filter((([_, keys]) => keys.length > 0));
  const labels = cols.flatMap(([_, keys]) => keys);
  return <Table>
    <TableHead>
      <TableRow>
        <TableCell rowSpan={2}>
          #Series
        </TableCell>
        {cols.map(([item, keys], i) => <TableCell key={i}
          align="center" colSpan={keys.length}>
          {item}
        </TableCell>)}
      </TableRow>
      <TableRow>
        {labels.map((label, i) => <TableCell key={i} align="center" >
          {label}
        </TableCell>)}
      </TableRow>
    </TableHead>
    <TableBody>
      {props.data.rows.map((row, i) => <TableRow
        key={i}
        hover
        onClick={(_ev) => props.setItem(row)}
      >
        <TableCell>
          {row.count}
        </TableCell>
        {labels.map((label, i) => <TableCell key={i}>
          {row.keys[label]}
        </TableCell>)}
      </TableRow>)}
    </TableBody>
  </Table>;
}


function MetricsTable(props: { data: components["schemas"]["MetricsData"] }) {
  return <Table>
    <TableHead>
      <TableRow>
        {props.data.cols.map((col, i) => <TableCell key={i} align="center">
          {col}
        </TableCell>)}
        <TableCell>
          Value
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {props.data.rows.map((row, i) => <TableRow key={i}>
        {props.data.cols.map((col, i) => <TableCell key={i}>
          {row.labels[col]}
        </TableCell>)}
        <TableCell>
          {row.value}
        </TableCell>
      </TableRow>)}
    </TableBody>
  </Table>;
}
