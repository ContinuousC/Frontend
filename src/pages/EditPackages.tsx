/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "../types/frontend";
import { components } from "../types/relation-graph-api";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
//import Autocomplete from '@mui/material/Autocomplete';
import TextField from "@mui/material/TextField";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { rg } from "../client";

export function EditPackages(_props: {}) {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="mb-1">
        <Breadcrumbs maxItems={5} separator="⯈">
          <Link to="/schema">schema</Link>
        </Breadcrumbs>
      </div>
      <div className="h-full w-full overflow-scroll">
        <h1 className="text-xl font-bold pt-2">Browse Packages</h1>
        <ul>
          <li>
            <Link to="discovery">Discovery</Link>
          </li>
          <li>
            <Link to="prometheus">Prometheus</Link>
          </li>
          <li>
            <Link to="connections">Connections</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function EditDiscoveryPackages(_props: {}) {
  const pkgs = useQuery({
    queryKey: [QueryKey.PackageList],
    queryFn: async () => {
      return await rg.get("/api/package");
    },
  });

  return (
    <div className="h-full w-full flex flex-col">
      <div className="mb-1">
        <Breadcrumbs maxItems={5} separator="⯈">
          <Link to="/schema">schema</Link>
          <Link to="/schema/discovery">discovery</Link>
        </Breadcrumbs>
      </div>
      <div className="h-full w-full overflow-scroll">
        <h1 className="text-xl font-bold pt-2">Browse Discovery Packages</h1>
        {pkgs.isLoading ? (
          <p>Loading...</p>
        ) : pkgs.isError ? (
          <p>Error: {pkgs.error.toString()}</p>
        ) : pkgs.data ? (
          <ul className="list-inside list-disc">
            {Object.entries(pkgs.data).map(([name, version]) => (
              <li key={name}>
                <Link to={name}>
                  {name} (v{version})
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function EditDiscoveryPackage(_props: {}) {
  const { pkg: pkgName } = useParams();

  if (pkgName === undefined) {
    throw new Error("missing 'pkg' param");
  }

  const pkg = useQuery({
    queryKey: [QueryKey.Package, pkgName],
    queryFn: async () => {
      return await rg.get("/api/package/{package}", {
        path: { package: pkgName },
      });
    },
  });

  return (
    <div className="h-full w-full flex flex-col">
      <div className="mb-1">
        <Breadcrumbs maxItems={5} separator="⯈">
          <Link to="/schema">schema</Link>
          <Link to="/schema/discovery">discovery</Link>
          <Link to={`/schema/discovery/${pkgName}`}>{pkgName}</Link>
        </Breadcrumbs>
      </div>
      <div className="h-full w-full overflow-scroll">
        <h1 className="text-xl font-bold pt-2">
          Package <i>{pkgName}</i>
          {pkg.data ? <> (v{pkg.data.version})</> : null}
        </h1>
        {pkg.isLoading && <p>Loading...</p>}
        {pkg.isError && <p>Error: {pkg.error.toString()}</p>}
        {pkg.data ? (
          <EditDiscoveryPackageLoaded pkgName={pkgName} pkg={pkg.data} />
        ) : null}
      </div>
    </div>
  );
}

function EditDiscoveryPackageLoaded(props: {
  pkgName: string;
  pkg: components["schemas"]["Package"];
}) {
  return (
    <>
      <h2 className="my-3 text-lg font-bold">Requires</h2>
      {Object.entries(props.pkg.requires).length == 0 ? (
        <p>No dependencies</p>
      ) : (
        <ul className="list-inside list-disc">
          {Object.entries(props.pkg.requires).map(([req, vreq]) => (
            <li key={req}>
              <Link to={`./../${req}`}>{req}</Link> → {vreq}
            </li>
          ))}
        </ul>
      )}

      <h2 className="my-3 text-lg font-bold">Items</h2>
      {Object.entries(props.pkg.items).length == 0 ? (
        <p>No items</p>
      ) : (
        <ul className="list-inside list-disc">
          {Object.keys(props.pkg.items).map((itemName) => (
            <li key={itemName}>
              <Link to={`item/${itemName}`}>{itemName}</Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="my-3 text-lg font-bold">Relations</h2>
      {Object.entries(props.pkg.relations).length == 0 ? (
        <p>No relations</p>
      ) : (
        <ul className="list-inside list-disc">
          {Object.keys(props.pkg.relations).map((relName) => (
            <li key={relName}>
              <Link to={`relation/${relName}`}>{relName}</Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="my-3 text-lg font-bold">Properties</h2>
      {Object.entries(props.pkg.relations).length == 0 ? (
        <p>No properties</p>
      ) : (
        <ul className="list-inside list-disc">
          {Object.keys(props.pkg.properties).map((propName) => (
            <li key={propName}>
              <Link to={`property/${propName}`}>{propName}</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function EditDiscoveryItem(_props: {}) {
  const { pkg: pkgName, item: itemName } = useParams();

  if (pkgName === undefined) {
    throw new Error("missing 'pkg' param");
  }

  if (itemName === undefined) {
    throw new Error("missing 'item' param");
  }

  const pkg = useQuery({
    queryKey: [QueryKey.Package, pkgName],
    queryFn: async () => {
      return await rg.get("/api/package/{package}", {
        path: { package: pkgName },
      });
    },
  });

  const item = useQuery({
    queryKey: [QueryKey.ItemInfo, pkgName, itemName],
    queryFn: async () => {
      return await rg.get("/api/types/item/{package}/{type}", {
        path: {
          package: pkgName,
          type: itemName,
        },
      });
    },
  });

  const linkTo = (typ: string, name: string): string => {
    const i = name.indexOf("/");
    return i == -1
      ? `./../../${typ}/${name}`
      : `./../../../${name.slice(0, i)}/${typ}/${name.slice(i)}`;
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="mb-1">
        <Breadcrumbs maxItems={5} separator="⯈">
          <Link to="/schema">schema</Link>
          <Link to="/schema/discovery">discovery</Link>
          <Link to={`/schema/discovery/${pkgName}`}>{pkgName}</Link>
          <>items</>
          <Link to={`/schema/discovery/${pkgName}/item/${itemName}`}>
            {itemName}
          </Link>
        </Breadcrumbs>
      </div>
      <div className="h-full w-full overflow-scroll">
        <h1 className="text-xl font-bold pt-2">
          Item{" "}
          <Link to="./../..">
            <i>{pkgName}</i>
          </Link>
          /<i>{itemName}</i>
          {pkg.data ? <> (v{pkg.data.version})</> : null}
        </h1>
        {pkg.isLoading && <p>Loading...</p>}
        {pkg.isError && <p>Error: {pkg.error.toString()}</p>}
        {item.data ? (
          <>
            <h2 className="my-3 text-lg font-bold">Info</h2>
            <p>
              Type Name: <i>{item.data.name.singular}</i> (singular) /{" "}
              <i>{item.data.name.plural}</i> (plural)
            </p>
            <p>
              Name template:{" "}
              {item.data.name_template ? (
                <i>{item.data.name_template}</i>
              ) : (
                <>(unset)</>
              )}
            </p>

            <h2 className="my-3 text-lg font-bold">Implements</h2>
            {item.data.implements.length === 0 ? (
              <>None</>
            ) : (
              <ul className="list-inside list-disc">
                {item.data.implements.map((typ) => (
                  <li key={typ}>
                    <Link to={linkTo("item", typ)}>{typ}</Link>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="my-3 text-lg font-bold">Implementors</h2>
            {item.data.implementors.length === 0 ? (
              <>None</>
            ) : (
              <ul className="list-inside list-disc">
                {item.data.implementors.map((typ) => (
                  <li key={typ}>
                    <Link to={linkTo("item", typ)}>{typ}</Link>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="my-3 text-lg font-bold">Parent Types</h2>
            {item.data.parents.length === 0 ? (
              <>None (root item)</>
            ) : (
              <ul className="list-inside list-disc">
                {item.data.parents.map((typ) => (
                  <li key={typ}>
                    <Link to={linkTo("item", typ)}>{typ}</Link>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="my-3 text-lg font-bold">Child Types</h2>
            {item.data.children.length === 0 ? (
              <>None</>
            ) : (
              <ul className="list-inside list-disc">
                {item.data.children.map((typ) => (
                  <li key={typ}>
                    <Link to={linkTo("item", typ)}>{typ}</Link>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="my-3 text-lg font-bold">Keys</h2>
            {item.data.keys.length === 0 ? (
              <>None (singleton)</>
            ) : (
              <ul className="list-inside list-disc">
                {item.data.keys.map((prop) => (
                  <li key={prop}>
                    <Link to={linkTo("property", prop)}>{prop}</Link>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="my-3 text-lg font-bold">Properties</h2>
            {Object.entries(item.data.properties).length === 0 ? (
              <>None</>
            ) : (
              <ul className="list-inside list-disc">
                {Object.entries(item.data.properties).map(([prop, _info]) => (
                  <li key={prop}>
                    <Link to={linkTo("property", prop)}>{prop}</Link>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="my-3 text-lg font-bold">Source of</h2>
            {item.data.source_of.length === 0 ? (
              <>None</>
            ) : (
              <ul className="list-inside list-disc">
                {item.data.source_of.map((typ) => (
                  <li key={typ}>
                    <Link to={linkTo("relation", typ)}>{typ}</Link>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="my-3 text-lg font-bold">Target of</h2>
            {item.data.source_of.length === 0 ? (
              <>None</>
            ) : (
              <ul className="list-inside list-disc">
                {item.data.source_of.map((typ) => (
                  <li key={typ}>
                    <Link to={linkTo("relation", typ)}>{typ}</Link>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="my-3 text-lg font-bold">Metrics</h2>
            {Object.entries(item.data.prometheus_metrics).length === 0 ? (
              <>None</>
            ) : (
              <ul className="list-inside list-disc">
                {Object.entries(item.data.prometheus_metrics).map(
                  ([pkg, metrics]) => (
                    <li key={pkg}>
                      <Link to={`./../../../../connections/${pkg}`}>{pkg}</Link>
                      <ul className="ml-3 list-inside list-disc">
                        {Object.entries(metrics).map(([item, conn]) => {
                          const i = item.indexOf(":");
                          const mName = item.slice(0, i);
                          const iName = item.slice(i + 1);
                          return (
                            <li key={item}>
                              <Link
                                to={`./../../../../prometheus/module/${mName}`}
                              >
                                {mName}
                              </Link>
                              :
                              <Link
                                to={`./../../../../prometheus/module/${mName}/${iName}`}
                              >
                                {iName}
                              </Link>
                              {conn.group_by && conn.group_by.length > 0 ? (
                                <> (by {conn.group_by.join(", ")})</>
                              ) : null}
                              <ul className="ml-6 list-inside list-disc">
                                {Object.entries(conn.keys).map(
                                  ([label, selector]) => (
                                    <li key={label}>
                                      {label}:{" "}
                                      <ItemKeySelector
                                        types={[`${pkgName}/${itemName}`]}
                                        value={selector}
                                        linkTo={linkTo}
                                      />
                                    </li>
                                  )
                                )}
                              </ul>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  )
                )}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function EditDiscoveryRelation(_props: {}) {
  const { pkg: pkgName, relation: relName } = useParams();

  if (pkgName === undefined) {
    throw new Error("missing 'pkg' param");
  }

  if (relName === undefined) {
    throw new Error("missing 'relation' param");
  }

  const pkg = useQuery({
    queryKey: [QueryKey.Package, pkgName],
    queryFn: async () => {
      return await rg.get("/api/package/{package}", {
        path: { package: pkgName },
      });
    },
  });

  const rel = useQuery({
    queryKey: [QueryKey.RelationInfo, pkgName, relName],
    queryFn: async () => {
      return await rg.get("/api/types/relation/{package}/{type}", {
        path: {
          package: pkgName,
          type: relName,
        },
      });
    },
  });

  const linkTo = (typ: string, name: string): string => {
    const i = name.indexOf("/");
    return i == -1
      ? `./../../${typ}/${name}`
      : `./../../../${name.slice(0, i)}/${typ}/${name.slice(i)}`;
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="mb-1">
        <Breadcrumbs maxItems={5} separator="⯈">
          <Link to="/schema">schema</Link>
          <Link to="/schema/discovery">discovery</Link>
          <Link to={`/schema/discovery/${pkgName}`}>{pkgName}</Link>
          <>relations</>
          <Link to={`/schema/discovery/${pkgName}/relation/${relName}`}>
            {relName}
          </Link>
        </Breadcrumbs>
      </div>
      <div className="h-full w-full overflow-scroll">
        <h1 className="text-xl font-bold pt-2">
          Relation{" "}
          <Link to="./../..">
            <i>{pkgName}</i>
          </Link>
          /<i>{relName}</i>
          {pkg.data ? <> (v{pkg.data.version})</> : null}
        </h1>
        {pkg.isLoading && <p>Loading...</p>}
        {pkg.isError && <p>Error: {pkg.error.toString()}</p>}
        {rel.data ? (
          <>
            <h2 className="my-3 text-lg font-bold">Info</h2>
            <p>
              Type Name: <i>{rel.data.name}</i>
            </p>
            <p>
              Description:{" "}
              {rel.data.description ? <i>{rel.data.description}</i> : <>none</>}
            </p>
            <p>Bidirectional: {rel.data.bidirectional ? "yes" : "no"}</p>
            <p>Multiplicity: {rel.data.multiplicity}</p>
            <p>
              Source:{" "}
              <Link to={linkTo("item", rel.data.source)}>
                {rel.data.source}
              </Link>
            </p>
            <p>
              Target:{" "}
              <Link to={linkTo("item", rel.data.target)}>
                {rel.data.target}
              </Link>
            </p>

            <h2 className="my-3 text-lg font-bold">Properties</h2>
            {Object.entries(rel.data.properties).length === 0 ? (
              <>None</>
            ) : (
              <ul className="list-inside list-disc">
                {Object.entries(rel.data.properties).map(([prop, _info]) => (
                  <li key={prop}>
                    <Link to={linkTo("property", prop)}>{prop}</Link>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="my-3 text-lg font-bold">Metrics</h2>
            {Object.entries(rel.data.prometheus_metrics).length === 0 ? (
              <>None</>
            ) : (
              <ul className="list-inside list-disc">
                {Object.entries(rel.data.prometheus_metrics).map(
                  ([pkg, metrics]) => (
                    <li key={pkg}>
                      <Link to={`./../../../../connections/${pkg}`}>{pkg}</Link>
                      <ul>
                        {Object.entries(metrics).map(([item, conn]) => {
                          const i = item.indexOf(":");
                          return (
                            <li key={item}>
                              <Link
                                to={`./../../../../prometheus/module/${item.slice(0, i)}/${item.slice(i + 1)}`}
                              >
                                {item}
                              </Link>
                              <ul className="ml-6 list-inside list-disc">
                                {Object.entries(conn.keys).map(
                                  ([label, selector]) => (
                                    <li key={label}>
                                      {label}:{" "}
                                      <RelationKeySelector
                                        types={[`S{pkgName}/${relName}`]}
                                        value={selector}
                                        linkTo={linkTo}
                                      />
                                    </li>
                                  )
                                )}
                              </ul>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  )
                )}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function EditDiscoveryProperty(_props: {}) {
  const { pkg: pkgName, property: propName } = useParams();

  if (pkgName === undefined) {
    throw new Error("missing 'pkg' param");
  }

  if (propName === undefined) {
    throw new Error("missing 'property' param");
  }

  const pkg = useQuery({
    queryKey: [QueryKey.Package, pkgName],
    queryFn: async () => {
      return await rg.get("/api/package/{package}", {
        path: { package: pkgName },
      });
    },
  });

  const prop = useQuery({
    queryKey: [QueryKey.RelationInfo, pkgName, propName],
    queryFn: async () => {
      return await rg.get("/api/types/property/{package}/{type}", {
        path: {
          package: pkgName,
          type: propName,
        },
      });
    },
  });

  return (
    <div className="h-full w-full flex flex-col">
      <div className="mb-1">
        <Breadcrumbs maxItems={5} separator="⯈">
          <Link to="/schema">schema</Link>
          <Link to="/schema/discovery">discovery</Link>
          <Link to={`/schema/discovery/${pkgName}`}>{pkgName}</Link>
          <>properties</>
          <Link to={`/schema/discovery/${propName}/property/${propName}`}>
            {propName}
          </Link>
        </Breadcrumbs>
      </div>
      <div className="h-full w-full overflow-scroll">
        <h1 className="text-xl font-bold pt-2">
          Property{" "}
          <Link to="./../..">
            <i>{pkgName}</i>
          </Link>
          /<i>{propName}</i>
          {pkg.data ? <> (v{pkg.data.version})</> : null}
        </h1>
        {pkg.isLoading && <p>Loading...</p>}
        {pkg.isError && <p>Error: {pkg.error.toString()}</p>}
        {prop.data ? (
          <>
            <h2 className="my-3 text-lg font-bold">Info</h2>
            <p>
              Name: <i>{prop.data.name}</i>
            </p>
            <p>
              Description:{" "}
              {prop.data.description ? (
                <i>{prop.data.description}</i>
              ) : (
                <>none</>
              )}
            </p>
            <p>Type: {JSON.stringify(prop.data.value)}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function EditConnectionsPackages(props: { editable?: boolean }) {
  const [editing, setEditing] = useState<{ [key: string]: string } | undefined>(
    undefined
  );

  const queryClient = useQueryClient();
  const pkgs = useQuery({
    queryKey: [QueryKey.ConnPackageList],
    queryFn: async () => {
      return await rg.get("/api/connections-package");
    },
  });

  return (
    <div className="h-full w-full flex flex-col">
      <div className="mb-1">
        <Breadcrumbs maxItems={5} separator="⯈">
          <Link to="/schema">schema</Link>
          <Link to="/schema/connections">connections</Link>
        </Breadcrumbs>
      </div>
      <div className="h-full w-full overflow-scroll">
        <h1 className="text-xl font-bold pt-2">
          Connections Packages
          {props.editable && pkgs.data ? (
            <>
              <> </>
              {editing ? (
                <IconButton
                  onClick={async () => {
                    await Promise.all(
                      Object.entries(editing)
                        .filter(([name, _version]) => !(name in pkgs.data))
                        .map(async ([name, version]) => {
                          await rg.put("/api/connections-package/{package}", {
                            path: { package: name },
                            body: {
                              version,
                              requires: {
                                discovery: {},
                                prometheus: {},
                              },
                              items: {},
                              relations: {},
                            },
                          });
                        })
                    );
                    await Promise.all(
                      Object.entries(pkgs.data)
                        .filter(([name, _version]) => !(name in editing))
                        .map(async ([name, _version]) => {
                          await rg.delete(
                            "/api/connections-package/{package}",
                            {
                              path: { package: name },
                            }
                          );
                        })
                    );
                    await Promise.all(
                      [
                        [QueryKey.ConnPackageList],
                        [QueryKey.ConnPackage],
                        [QueryKey.ItemInstantMetric],
                        [QueryKey.ItemRangeMetric],
                        [QueryKey.ItemTypeInstantMetric],
                        [QueryKey.ItemTypeRangeMetric],
                        [QueryKey.InstantMetric],
                        [QueryKey.RangeMetric],
                        [QueryKey.TableMetric],
                      ].map(async (queryKey) => {
                        await queryClient.invalidateQueries({ queryKey });
                      })
                    );
                    setEditing(undefined);
                  }}
                >
                  <SaveIcon />
                </IconButton>
              ) : (
                <IconButton onClick={() => setEditing(pkgs.data)}>
                  <EditIcon />
                </IconButton>
              )}
            </>
          ) : null}
        </h1>
        {pkgs.isLoading ? (
          <p>Loading...</p>
        ) : pkgs.isError ? (
          <p>Error: {pkgs.error.toString()}</p>
        ) : pkgs.data ? (
          (props.editable && editing) ||
            Object.entries(editing || pkgs.data).length > 0 ? (
            <ul className={editing ? "list-inside" : "list-inside list-disc"}>
              {Object.entries(editing || pkgs.data).map(([name, version]) => (
                <li key={name}>
                  {editing && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newPkgs = Object.fromEntries(
                          Object.entries(editing).filter(
                            ([entName, _version]) => entName !== name
                          )
                        );
                        setEditing(newPkgs);
                      }}
                    >
                      <RemoveCircleIcon fontSize="small" />
                    </IconButton>
                  )}
                  {!editing ? (
                    <Link to={name}>
                      {name} (v{version})
                    </Link>
                  ) : (
                    <>
                      <EditText
                        placeholder="name"
                        value={name}
                        setValue={
                          !(name in pkgs.data)
                            ? (newName) => {
                              if (
                                editing &&
                                !(newName in pkgs.data) &&
                                !(newName in editing)
                              ) {
                                const newPkgs = Object.fromEntries(
                                  Object.entries(editing).map(
                                    ([entName, version]) =>
                                      entName === name
                                        ? [newName, version]
                                        : [entName, version]
                                  )
                                );
                                setEditing(newPkgs);
                              }
                            }
                            : undefined
                        }
                      />{" "}
                      (v
                      <EditText
                        placeholder="version"
                        value={version}
                        setValue={
                          !(name in pkgs.data)
                            ? (newVersion) => {
                              if (editing) {
                                const newPkgs = Object.fromEntries(
                                  Object.entries(editing).map(
                                    ([entName, version]) =>
                                      entName === name
                                        ? [entName, newVersion]
                                        : [entName, version]
                                  )
                                );
                                setEditing(newPkgs);
                              }
                            }
                            : undefined
                        }
                      />
                      )
                    </>
                  )}
                </li>
              ))}
              {editing && (
                <IconButton
                  size="small"
                  onClick={() => {
                    const newPkgs = Object.fromEntries(
                      Object.entries(editing).concat([["", "0.1.0"]])
                    );
                    setEditing(newPkgs);
                  }}
                >
                  <AddCircleIcon fontSize="small" />
                </IconButton>
              )}
            </ul>
          ) : (
            <p>no packages</p>
          )
        ) : null}
      </div>
    </div>
  );
}

export function EditConnectionsPackage(props: { editable?: boolean }) {
  const { pkg: pkgName } = useParams();

  if (pkgName === undefined) {
    throw new Error("missing 'pkg' param");
  }

  const queryClient = useQueryClient();
  const pkg = useQuery({
    queryKey: [QueryKey.ConnPackage, pkgName],
    queryFn: async () => {
      return await rg.get("/api/connections-package/{package}", {
        path: {
          package: pkgName,
        },
      });
    },
  });

  const [editing, setEditing] = useState(false);
  const [newPkg, setNewPkg] = useState<
    undefined | components["schemas"]["ConnectionsPackage"]
  >();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="mb-1">
        <Breadcrumbs maxItems={5} separator="⯈">
          <Link to="/schema">schema</Link>
          <Link to="/schema/connections">connections</Link>
          <Link to={`/schema/connections/${pkgName}`}>{pkgName}</Link>
        </Breadcrumbs>
      </div>
      <div className="h-full w-full overflow-scroll">
        <h1 className="text-xl font-bold pt-2">
          Connections Package <i>{pkgName}</i>
          {pkg.data ? <> (v{pkg.data.version})</> : null}
          {pkg.data && props.editable ? (
            editing ? (
              <>
                <> </>
                <IconButton
                  onClick={async () => {
                    const updated = newPkg || pkg.data;
                    if (updated) {
                      await rg.put("/api/connections-package/{package}", {
                        path: { package: pkgName },
                        body: updated,
                      });
                      await Promise.all(
                        [
                          [QueryKey.ConnPackage, pkgName],
                          [QueryKey.ItemInstantMetric],
                          [QueryKey.ItemRangeMetric],
                          [QueryKey.ItemTypeInstantMetric],
                          [QueryKey.ItemTypeRangeMetric],
                          [QueryKey.InstantMetric],
                          [QueryKey.RangeMetric],
                          [QueryKey.TableMetric],
                        ].map(async (queryKey) => {
                          await queryClient.invalidateQueries({ queryKey });
                        })
                      );
                    }
                    setEditing(false);
                  }}
                >
                  <SaveIcon />
                </IconButton>
              </>
            ) : (
              <>
                <> </>
                <IconButton onClick={() => setEditing(true)}>
                  <EditIcon />
                </IconButton>
                <IconButton href={`/api/connections-package/${pkgName}`}>
                  <DownloadIcon />
                </IconButton>
              </>
            )
          ) : null}
        </h1>
        {pkg.isLoading ? (
          <p>Loading...</p>
        ) : pkg.isError ? (
          <p>Error: {pkg.error.toString()}</p>
        ) : pkg.data ? (
          <EditConnectionsPackageLoaded
            pkgName={pkgName}
            pkg={newPkg || pkg.data}
            setValue={props.editable && editing ? setNewPkg : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}

type AddItem = (opts?: { start?: boolean }) => void;
type RemoveItem = () => void;

function EditMap<T, C extends {} = {}>(props: {
  value: { [key: string]: T };
  setValue?: (newValue: { [key: string]: T }) => void;
  defaultKey?: string;
  defaultValue: T;
  itemContext?: (key: string, value: T) => C;
  Title?: React.FunctionComponent<{ editing: boolean; addItem: AddItem }>;
  List?: React.FunctionComponent<{
    children: React.ReactNode;
    editing: boolean;
    addItem: AddItem;
  }>;
  Item?: React.FunctionComponent<{
    children: [React.ReactNode, React.ReactNode];
    keyValue: string;
    value: T;
    editing: boolean;
    removeItem: RemoveItem;
  }>;
  Key: React.FunctionComponent<
    C & {
      value: string;
      setValue?: (newValue: string) => void;
      editing: boolean;
      removeItem: RemoveItem;
    }
  >;
  Value: React.FunctionComponent<
    C & { keyValue: string; value: T; setValue?: (newValue: T) => void }
  >;
  Empty?: React.FunctionComponent;
  emptyWhenEditing?: boolean;
}) {
  const List =
    props.List ||
    (({ children, editing, addItem }) => (
      <ul>
        {children}
        {editing && (
          <IconButton size="small" onClick={() => addItem()}>
            <AddCircleIcon fontSize="small" />
          </IconButton>
        )}
      </ul>
    ));
  const Item =
    props.Item ||
    (({ children, editing, removeItem }) => (
      <li>
        {editing && (
          <IconButton size="small" onClick={() => removeItem()}>
            <RemoveCircleIcon fontSize="small" />
          </IconButton>
        )}
        {children}
      </li>
    ));

  const addItem: AddItem = (opts?: { start?: boolean }) => {
    if (props.setValue) {
      const newKey = props.defaultKey || "";
      const prevEnts = Object.entries(props.value).filter(
        ([key, _val]) => key !== newKey
      );
      const newEnts = [[newKey, props.defaultValue]] as [string, T][];
      const map = opts?.start
        ? Object.fromEntries(newEnts.concat(prevEnts))
        : Object.fromEntries(prevEnts.concat(newEnts));
      props.setValue(map);
    }
  };

  return (
    <>
      {props.Title && (
        <props.Title editing={!!props.setValue} addItem={addItem} />
      )}
      {props.setValue || Object.entries(props.value).length > 0 ? (
        <List editing={!!props.setValue} addItem={addItem}>
          {Object.entries(props.value).map(([key, value]) => {
            const removeItem: RemoveItem = () => {
              if (props.setValue) {
                const map = Object.assign({}, props.value);
                delete map[key];
                props.setValue(map);
              }
            };
            const ctx = props.itemContext
              ? props.itemContext(key, value)
              : ({} as C);
            return (
              <Item
                key={key}
                keyValue={key}
                value={value}
                editing={!!props.setValue}
                removeItem={removeItem}
              >
                <props.Key
                  {...ctx}
                  value={key}
                  setValue={
                    props.setValue
                      ? (newKey) => {
                        if (props.setValue && key !== newKey) {
                          const map =
                            newKey in props.value
                              ? props.value
                              : Object.fromEntries(
                                Object.entries(props.value).map(
                                  ([entKey, value]) =>
                                    entKey === key
                                      ? [newKey, value]
                                      : [entKey, value]
                                )
                              );
                          props.setValue(map);
                        }
                      }
                      : undefined
                  }
                  editing={!!props.setValue}
                  removeItem={removeItem}
                />
                <props.Value
                  {...ctx}
                  key={key}
                  keyValue={key}
                  value={value}
                  setValue={
                    props.setValue
                      ? (newValue) => {
                        if (props.setValue) {
                          const map = Object.fromEntries(
                            Object.entries(props.value).map(
                              ([entKey, value]) =>
                                entKey === key
                                  ? [key, newValue]
                                  : [entKey, value]
                            )
                          );
                          props.setValue(map);
                        }
                      }
                      : undefined
                  }
                />
              </Item>
            );
          })}
        </List>
      ) : null}
      {props.Empty &&
        (!props.setValue || props.emptyWhenEditing) &&
        Object.entries(props.value).length === 0 && <props.Empty />}
    </>
  );
}

function EditText(props: {
  placeholder: string;
  value: string;
  setValue?: (newValue: string) => void;
  options?: string[];
  link?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(props.value);

  const finishEditing = () => {
    if (props.setValue) {
      props.setValue(value);
    }
    setEditing(false);
  };

  return props.setValue ? (
    editing ? (
      <ClickAwayListener onClickAway={() => finishEditing()}>
        {props.options ? (
          <Select
            size="small"
            MenuProps={{ disablePortal: true }}
            autoFocus
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
          >
            <MenuItem disabled value="">
              <em>{props.placeholder}</em>
            </MenuItem>
            {props.options.map((key) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </Select>
        ) : (
          <TextField
            size="small"
            placeholder={props.placeholder}
            autoFocus
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                finishEditing();
              }
            }}
          />
        )}
      </ClickAwayListener >
    ) : (
      <span
        onClick={() => {
          if (props.options && props.options.indexOf(value) === -1) {
            setValue(props.options[0]);
          }
          setEditing(true);
        }}
      >
        {value || `(${props.placeholder})`}
      </span>
    )
  ) : props.link ? (
    <Link to={props.link}>{value || `(${props.placeholder})`}</Link>
  ) : (
    value || `(${props.placeholder})`
  );
}

function EditConnectionsPackageLoaded(props: {
  pkgName: string;
  pkg: components["schemas"]["ConnectionsPackage"];
  setValue?: (newValue: components["schemas"]["ConnectionsPackage"]) => void;
}) {
  const groupByPkg = (items: string[]) => {
    return items.reduce(
      (items, item) => {
        const i = item.indexOf("/");
        const pkgName = item.slice(0, i);
        const itemName = item.slice(i + 1);
        if (!(pkgName in items)) {
          items[pkgName] = [];
        }
        items[pkgName].push(itemName);
        return items;
      },
      {} as { [key: string]: string[] }
    );
  };

  const itemsByPackage = useQuery({
    queryKey: [QueryKey.ItemList],
    queryFn: async () => {
      const items = await rg.get("/api/types/item");
      return groupByPkg(items);
    },
  });

  const relationsByPackage = useQuery({
    queryKey: [QueryKey.RelationList],
    queryFn: async () => {
      const relations = await rg.get("/api/types/relation");
      return groupByPkg(relations);
    },
  });

  const promItemsByModule = useQuery({
    queryKey: [QueryKey.PromItemList],
    queryFn: async () => {
      return await rg.get("/api/prom-schema/items");
    },
  });

  const linkTo = (type: string, name: string) => {
    const i = name.indexOf("/");
    const pName = name.slice(0, i);
    const iName = name.slice(i + 1);
    return `./../../discovery/${pName}/${type}/${iName}`;
  };

  return (
    <>
      <EditConnections
        kind="item"
        title="Item connections"
        value={props.pkg.items}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue) {
                const newPkg = Object.assign({}, props.pkg);
                newPkg.items = newValue;
                props.setValue(newPkg);
              }
            }
            : undefined
        }
        KeySelector={ItemKeySelector}
        defaultValue={{ property: "" }}
        pkgName={props.pkgName}
        linkTo={linkTo}
        itemsByPackage={itemsByPackage.data}
        promItemsByModule={promItemsByModule.data}
      />
      <EditConnections
        kind="relation"
        title="Relation connections"
        value={props.pkg.relations}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue) {
                const newPkg = Object.assign({}, props.pkg);
                newPkg.relations = newValue;
                props.setValue(newPkg);
              }
            }
            : undefined
        }
        KeySelector={RelationKeySelector}
        defaultValue={{ property: "" }}
        pkgName={props.pkgName}
        linkTo={linkTo}
        itemsByPackage={relationsByPackage.data}
        promItemsByModule={promItemsByModule.data}
      />
    </>
  );
}

type Connections<T> = {
  [key: string]: {
    prometheus: {
      [key: string]: {
        group_by?: components["schemas"]["LabelName"][] | null;
        keys: {
          [key: string]: T;
        };
      };
    };
  };
};

function EditConnections<T>(props: {
  kind: string;
  title: string;
  value: Connections<T>;
  setValue?: (newValue: Connections<T>) => void;
  KeySelector: React.FunctionComponent<{
    types?: string[];
    value: T;
    setValue?: (newValue: T) => void;
    linkTo: (type: string, item: string) => string;
  }>;
  defaultValue: T;
  pkgName: string;
  linkTo: (type: string, item: string) => string;
  itemsByPackage?: { [pkg: string]: string[] };
  promItemsByModule?: { [mod: string]: string[] };
}) {
  return (
    <EditMap
      value={props.value}
      defaultKey={"/"}
      defaultValue={{ prometheus: {} }}
      setValue={
        props.setValue
          ? (newValue) => {
            if (props.setValue) {
              props.setValue(newValue);
            }
          }
          : undefined
      }
      Title={({ editing, addItem }) => (
        <h2 className="my-3 text-lg font-bold">
          {props.title}
          {editing && (
            <IconButton size="small" onClick={() => addItem({ start: true })}>
              <AddCircleIcon fontSize="small" />
            </IconButton>
          )}
        </h2>
      )}
      Empty={() => "no connections"}
      emptyWhenEditing
      List={({ children }) => children}
      Item={({ children }) => children}
      itemContext={(name, _value) => {
        const i = name.indexOf("/");
        const pkgName = name.slice(0, i);
        const itemName = name.slice(i + 1);
        return { pkgName, itemName, discoveryItemName: name };
      }}
      Key={({ setValue, editing, removeItem, pkgName, itemName }) => {
        return (
          <h3 className="my-3 text-base font-bold">
            <EditText
              placeholder="package"
              link={`./../../discovery/${pkgName}`}
              value={pkgName}
              options={
                props.itemsByPackage
                  ? Object.keys(props.itemsByPackage)
                  : undefined
              }
              setValue={
                setValue
                  ? (newValue) => setValue(`${newValue}/${itemName}`)
                  : undefined
              }
            />
            /
            <EditText
              placeholder={props.kind}
              link={`./../../discovery/${pkgName}/${props.kind}/${itemName}`}
              value={itemName}
              options={props.itemsByPackage?.[pkgName]}
              setValue={
                setValue
                  ? (newValue) => setValue(`${pkgName}/${newValue}`)
                  : undefined
              }
            />
            {editing && (
              <IconButton size="small" onClick={removeItem}>
                <RemoveCircleIcon fontSize="small" />
              </IconButton>
            )}
          </h3>
        );
      }}
      Value={({ value: item, setValue, discoveryItemName }) => {
        return (
          <EditMap
            value={item.prometheus}
            defaultKey=":"
            defaultValue={{ keys: {} }}
            setValue={
              setValue
                ? (newValue) => {
                  const newItem = Object.assign({}, item);
                  newItem.prometheus = newValue;
                  setValue(newItem);
                }
                : undefined
            }
            Empty={() => <h4 className="my-3 text-base italic">no metrics</h4>}
            List={({ children, editing, addItem }) => (
              <>
                <h4 className="my-3 text-base italic">metrics</h4>
                <ul
                  className={editing ? "list-inside" : "list-inside list-disc"}
                >
                  {children}
                  {editing && (
                    <li>
                      <IconButton size="small" onClick={() => addItem()}>
                        <AddCircleIcon fontSize="small" />
                      </IconButton>
                    </li>
                  )}
                </ul>
              </>
            )}
            itemContext={(item, _value) => {
              const i = item.indexOf(":");
              const modName = item.slice(0, i);
              const itemName = item.slice(i + 1);
              return { modName, itemName, discoveryItemName };
            }}
            Key={({ setValue, modName, itemName }) => {
              return (
                <>
                  <EditText
                    placeholder="module"
                    link={`./../../prometheus/module/${modName}`}
                    value={modName}
                    options={
                      props.promItemsByModule &&
                      Object.keys(props.promItemsByModule)
                    }
                    setValue={
                      setValue
                        ? (newValue) => setValue(`${newValue}:${itemName}`)
                        : undefined
                    }
                  />
                  :
                  <EditText
                    placeholder="item"
                    link={`./../../prometheus/module/${modName}/${itemName}`}
                    value={itemName}
                    options={props.promItemsByModule?.[modName]}
                    setValue={
                      setValue
                        ? (newValue) => setValue(`${modName}:${newValue}`)
                        : undefined
                    }
                  />
                </>
              );
            }}
            Value={({ value: conn, setValue }) => {
              return (
                <>
                  {conn.group_by && conn.group_by.length > 0 ? (
                    <> (by {conn.group_by.join(", ")})</>
                  ) : null}
                  <EditMap
                    value={conn.keys}
                    defaultValue={props.defaultValue}
                    setValue={
                      setValue
                        ? (newValue) => {
                          const newConn = Object.assign({}, conn);
                          newConn.keys = newValue;
                          setValue(newConn);
                        }
                        : undefined
                    }
                    List={({ children, editing, addItem }) => (
                      <ul
                        className={
                          editing
                            ? "ml-6 list-inside"
                            : "ml-3 list-inside list-disc"
                        }
                      >
                        {children}
                        {editing && (
                          <li>
                            <IconButton size="small" onClick={() => addItem()}>
                              <AddCircleIcon fontSize="small" />
                            </IconButton>
                          </li>
                        )}
                      </ul>
                    )}
                    Item={({ children, editing, removeItem }) => (
                      <li className="text-nowrap">
                        {editing && (
                          <IconButton size="small" onClick={() => removeItem()}>
                            <RemoveCircleIcon fontSize="small" />
                          </IconButton>
                        )}
                        {children}
                      </li>
                    )}
                    itemContext={(_key, _value) => {
                      return { discoveryItemName };
                    }}
                    Key={({ value: label, setValue }) => {
                      return (
                        <>
                          <EditText
                            placeholder="label"
                            value={label}
                            setValue={setValue}
                          />
                          :{" "}
                        </>
                      );
                    }}
                    Value={({ value: selector, setValue }) => {
                      return (
                        <span className="inline-block align-top">
                          <DeferEditing
                            Component={props.KeySelector}
                            types={[discoveryItemName]}
                            value={selector}
                            setValue={setValue}
                            linkTo={props.linkTo}
                          />
                        </span>
                      );
                    }}
                  />
                </>
              );
            }}
          />
        );
      }}
    />
  );
}

function DeferEditing<P extends { value: unknown; setValue?: unknown }>(
  props: P extends { value: infer V; setValue?: (newValue: infer V) => void }
    ? P & {
      Component: React.FunctionComponent<P>;
      value: V;
      setValue?: (newValue: V) => void;
    }
    : never
) {
  const { Component, value, setValue, ...otherProps } = props;
  const [editing, setEditing] = useState(false);
  const [updatedValue, setUpdatedValue] = useState(value);

  return setValue && editing ? (
    <ClickAwayListener
      onClickAway={() => {
        setEditing(false);
        setValue(updatedValue);
      }}
    >
      <span>
        <Component
          value={updatedValue}
          setValue={setUpdatedValue}
          {...otherProps}
        />
      </span>
    </ClickAwayListener>
  ) : (
    <>
      <Component value={updatedValue} {...otherProps} />
      {setValue ? (
        <IconButton size="small" onClick={() => setEditing(true)}>
          <EditIcon fontSize="small" />
        </IconButton>
      ) : null}
    </>
  );
}

function ItemKeySelector(props: {
  types?: string[];
  value: components["schemas"]["ItemKeySelector"];
  linkTo: (type: string, name: string) => string;
  setValue?: (newValue: components["schemas"]["ItemKeySelector"]) => void;
}) {
  const ctx = { item: props.types || null };
  const info = useQuery({
    queryKey: ([QueryKey.SelectorCtx] as string[]).concat(
      selectorCtxQueryKey(ctx)
    ),
    queryFn: async () => {
      return await rg.post("/api/types/selector", { body: ctx });
    },
    enabled: !!props.setValue,
  });

  return "parent" in props.value ? (
    <>
      <ItemKeySelectorTag
        tag="parent"
        value={props.value}
        setValue={props.setValue}
        info={info.data}
      />{" "}
      (
      <ItemSelector
        types={info.data?.parents}
        value={props.value.parent.item}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "parent" in props.value) {
                props.setValue({
                  parent: { item: newValue, key: props.value.parent.key },
                });
              }
            }
            : undefined
        }
      />
      ){props.setValue && <br />}
      <> ⯈ </>
      <ItemKeySelector
        types={
          getSelectedTypes(props.value.parent.item.item_type) ||
          info.data?.parents
        }
        value={props.value.parent.key}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "parent" in props.value) {
                props.setValue({
                  parent: { item: props.value.parent.item, key: newValue },
                });
              }
            }
            : undefined
        }
      />
    </>
  ) : "relation" in props.value ? (
    <>
      <ItemKeySelectorTag
        tag="relation"
        value={props.value}
        setValue={props.setValue}
        info={info.data}
      />{" "}
      (
      <RelationSelector
        types={info.data?.relations}
        value={props.value.relation.relation}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "relation" in props.value) {
                props.setValue({
                  relation: {
                    relation: newValue,
                    key: props.value.relation.key,
                  },
                });
              }
            }
            : undefined
        }
      />
      ){props.setValue && <br />}
      <> ⯈ </>
      <RelationKeySelector
        types={
          getSelectedTypes(props.value.relation.relation.relation_type) ||
          info.data?.relations
        }
        value={props.value.relation.key}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "relation" in props.value) {
                props.setValue({
                  relation: {
                    relation: props.value.relation.relation,
                    key: newValue,
                  },
                });
              }
            }
            : undefined
        }
      />
    </>
  ) : (
    /* "property" in value ? */ <>
      <ItemKeySelectorTag
        tag="property"
        value={props.value}
        setValue={props.setValue}
        info={info.data}
      />
      <SelectProperty
        value={props.value.property}
        options={info.data?.properties}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue) {
                props.setValue({ property: newValue });
              }
            }
            : undefined
        }
      />
    </>
  );
}

function ItemKeySelectorTag(props: {
  tag: "parent" | "relation" | "property";
  value: components["schemas"]["ItemKeySelector"];
  setValue?: (newValue: components["schemas"]["ItemKeySelector"]) => void;
  info?: components["schemas"]["SelectorCtxInfo"];
}) {
  const parent = props.info?.parents?.[0];
  const relation = props.info?.relations?.[0];
  const property = props.info?.properties?.[0];

  return props.setValue ? (
    <Select
      size="small"
      MenuProps={{ disablePortal: true }}
      value={props.tag}
      onChange={(ev) => {
        if (props.setValue) {
          const newTag = ev.target.value as "parent" | "relation" | "property";
          const newValue =
            newTag === "property"
              ? {
                property:
                  "property" in props.value
                    ? props.value.property
                    : property || "",
              }
              : newTag === "parent"
                ? {
                  parent:
                    "parent" in props.value
                      ? props.value.parent
                      : {
                        item: { item_type: { is: parent || "" } },
                        key: { property: property || "" },
                      },
                }
                : /* newTag === "relation" ? */ {
                  relation:
                    "relation" in props.value
                      ? props.value.relation
                      : {
                        relation: { relation_type: { is: relation || "" } },
                        key: { property: property || "" },
                      },
                };
          props.setValue(newValue);
        }
      }}
    >
      {[parent && "parent", relation && "relation", property && "property"]
        .filter((opt) => opt !== undefined)
        .map((tag) => (
          <MenuItem key={tag} value={tag}>
            {tag}
          </MenuItem>
        ))}
    </Select>
  ) : (
    <>{props.tag}</>
  );
}

function RelationKeySelector(props: {
  types?: string[];
  value: components["schemas"]["RelationKeySelector"];
  linkTo: (type: string, name: string) => string;
  setValue?: (newValue: components["schemas"]["RelationKeySelector"]) => void;
}) {
  const ctx = { relation: props.types || null };
  const info = useQuery({
    queryKey: ([QueryKey.SelectorCtx] as string[]).concat(
      selectorCtxQueryKey(ctx)
    ),
    queryFn: async () => {
      return await rg.post("/api/types/selector", { body: ctx });
    },
    enabled: !!props.setValue,
  });

  return "item" in props.value ? (
    <>
      <RelationKeySelectorTag
        tag="item"
        value={props.value}
        setValue={props.setValue}
        info={info.data}
      />{" "}
      (
      <ItemSelector
        types={info.data?.items}
        value={props.value.item.item}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "item" in props.value) {
                props.setValue({
                  item: { item: newValue, key: props.value.item.key },
                });
              }
            }
            : undefined
        }
      />
      ){props.setValue && <br />}
      <> ⯈ </>
      <ItemKeySelector
        types={
          getSelectedTypes(props.value.item.item.item_type) ||
          info.data?.parents
        }
        value={props.value.item.key}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "item" in props.value) {
                props.setValue({
                  item: { item: props.value.item.item, key: newValue },
                });
              }
            }
            : undefined
        }
      />
    </>
  ) : "source" in props.value ? (
    <>
      <RelationKeySelectorTag
        tag="source"
        value={props.value}
        setValue={props.setValue}
        info={info.data}
      />{" "}
      (
      <ItemSelector
        types={info.data?.sources}
        value={props.value.source.item}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "source" in props.value) {
                props.setValue({
                  source: { item: newValue, key: props.value.source.key },
                });
              }
            }
            : undefined
        }
      />
      ){props.setValue && <br />}
      <> ⯈ </>
      <ItemKeySelector
        types={
          getSelectedTypes(props.value.source.item.item_type) ||
          info.data?.sources
        }
        value={props.value.source.key}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "source" in props.value) {
                props.setValue({
                  item: { item: props.value.source.item, key: newValue },
                });
              }
            }
            : undefined
        }
      />
    </>
  ) : "target" in props.value ? (
    <>
      <RelationKeySelectorTag
        tag="target"
        value={props.value}
        setValue={props.setValue}
        info={info.data}
      />{" "}
      (
      <ItemSelector
        types={info.data?.targets}
        value={props.value.target.item}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "target" in props.value) {
                props.setValue({
                  source: { item: newValue, key: props.value.target.key },
                });
              }
            }
            : undefined
        }
      />
      ){props.setValue && <br />}
      <> ⯈ </>
      <ItemKeySelector
        types={
          getSelectedTypes(props.value.target.item.item_type) ||
          info.data?.targets
        }
        value={props.value.target.key}
        linkTo={props.linkTo}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue && "target" in props.value) {
                props.setValue({
                  item: { item: props.value.target.item, key: newValue },
                });
              }
            }
            : undefined
        }
      />
    </>
  ) : (
    /* "property" in props.value ? */ <>
      <RelationKeySelectorTag
        tag="property"
        value={props.value}
        setValue={props.setValue}
        info={info.data}
      />
      <SelectProperty
        value={props.value.property}
        options={info.data?.properties}
        setValue={
          props.setValue
            ? (newValue) => {
              if (props.setValue) {
                props.setValue({ property: newValue });
              }
            }
            : undefined
        }
      />
    </>
  );
}

function RelationKeySelectorTag(props: {
  tag: "item" | "source" | "target" | "property";
  value: components["schemas"]["RelationKeySelector"];
  setValue?: (newValue: components["schemas"]["RelationKeySelector"]) => void;
  info?: components["schemas"]["SelectorCtxInfo"];
}) {
  const item = props.info?.items?.[0];
  const source = props.info?.sources?.[0];
  const target = props.info?.targets?.[0];
  const property = props.info?.properties?.[0];

  return props.setValue ? (
    <Select
      size="small"
      MenuProps={{ disablePortal: true }}
      value={props.tag}
      onChange={(ev) => {
        if (props.setValue) {
          const newTag = ev.target.value as
            | "item"
            | "source"
            | "target"
            | "property";
          const item =
            "item" in props.value
              ? props.value.item
              : "source" in props.value
                ? props.value.source
                : "target" in props.value
                  ? props.value.target
                  : undefined;
          const newValue =
            newTag === "property"
              ? {
                property:
                  "property" in props.value
                    ? props.value.property
                    : property || "",
              }
              : newTag === "item"
                ? {
                  item: item || {
                    item: { item_type: { is: item || "" } },
                    key: { property: property || "" },
                  },
                }
                : newTag === "source"
                  ? {
                    source: item || {
                      item: { item_type: { is: source || "" } },
                      key: { property: property || "" },
                    },
                  }
                  : /* newTag === "target" ? */ {
                    target: item || {
                      item: { item_type: { is: target || "" } },
                      key: { property: property || "" },
                    },
                  };
          props.setValue(newValue);
        }
      }}
    >
      {[
        item && "item",
        source && "source",
        target && "target",
        property && "property",
      ]
        .filter((opt) => opt !== undefined)
        .map((tag) => (
          <MenuItem key={tag} value={tag}>
            {tag}
          </MenuItem>
        ))}
    </Select>
  ) : (
    <>{props.tag}</>
  );
}

function getSelectedTypes(
  value: components["schemas"]["ItemSelector"]["item_type"]
): string[] | undefined {
  return value && "is" in value
    ? [value.is]
    : value && "in" in value
      ? value.in
      : undefined;
}

function SelectProperty(props: {
  value: string;
  setValue?: (newValue: string) => void;
  options?: string[];
}) {
  return props.setValue ? (
    <Select
      size="small"
      MenuProps={{ disablePortal: true }}
      value={props.value}
      onChange={(ev) => {
        if (props.setValue) {
          props.setValue(ev.target.value);
        }
      }}
    >
      {(props.options || []).map((prop) => (
        <MenuItem key={prop} value={prop}>
          {prop}
        </MenuItem>
      ))}
    </Select>
  ) : (
    <> {props.value}</>
  );
}

function selectorCtxQueryKey(
  ctx: components["schemas"]["SelectorCtx"]
): string[] {
  return "item" in ctx
    ? ctx.item
      ? ["item", "types"].concat(ctx.item)
      : ["item", "any"]
    : /* "relation" in ctx ? */ ctx.relation
      ? ["relation", "types"].concat(ctx.relation)
      : ["relation", "any"];
}

function selector<T extends {}, K extends string & keyof T>(
  value: T,
  setValue: ((newValue: T) => void) | undefined,
  field: K,
  name: string,
  addable: boolean,
  dflt: NonNullable<T[K]>,
  f: (
    name: string,
    value: NonNullable<T[K]>,
    setValue?: (newValue: NonNullable<T[K]>) => void
  ) => React.ReactElement
) {
  return value[field]
    ? [
      setValue ? (
        <Fragment key={field}>
          <IconButton
            size="small"
            onClick={() => {
              if (setValue) {
                // Better way to convince typescript this is okay?
                var newValue = Object.assign({}, value) as {
                  [key in K]: null;
                };
                newValue[field] = null;
                setValue(newValue as T);
              }
            }}
          >
            <RemoveCircleIcon fontSize="small" />
          </IconButton>
          {f(name, value[field], (updated) => {
            if (setValue) {
              var newValue = Object.assign({}, value);
              newValue[field] = updated;
              setValue(newValue);
            }
          })}
        </Fragment>
      ) : (
        <Fragment key={field}>{f(name, value[field])}</Fragment>
      ),
    ]
    : setValue && addable
      ? [
        <Fragment key={field}>
          <IconButton
            size="small"
            onClick={() => {
              if (setValue) {
                var newValue = Object.assign({}, value);
                newValue[field] = dflt;
                setValue(newValue);
              }
            }}
          >
            <AddCircleIcon fontSize="small" />
          </IconButton>
          {name}
        </Fragment>,
      ]
      : [];
}

function ItemSelector(props: {
  types?: string[] | null;
  value: components["schemas"]["ItemSelector"];
  linkTo: (type: string, name: string) => string;
  setValue?: (newValue: components["schemas"]["ItemSelector"]) => void;
}) {
  const ctx = {
    item: getSelectedTypes(props.value.item_type) || props.types || null,
  };
  const info = useQuery({
    queryKey: ([QueryKey.SelectorCtx] as string[]).concat(
      selectorCtxQueryKey(ctx)
    ),
    queryFn: async () => {
      return props.setValue
        ? await rg.post("/api/types/selector", {
          body: ctx,
        })
        : null;
    },
    enabled: !!props.setValue,
  });

  return intersperse(
    ", ",
    [
      selector(
        props.value,
        props.setValue,
        "item_id",
        "id",
        false,
        { is: "" },
        (name, value, setValue) => (
          <Selector name={name} value={value} setValue={setValue} />
        )
      ),
      selector(
        props.value,
        props.setValue,
        "item_type",
        "type",
        true,
        { is: "" },
        (name, value, setValue) => (
          <Selector
            name={name}
            value={value}
            setValue={setValue}
            options={props.types}
          />
        )
      ),
      selector(
        props.value,
        props.setValue,
        "parent",
        "parent",
        true,
        {},
        (name, value, setValue) => (
          <>
            {name} (
            <ItemSelector
              types={info.data?.parents}
              value={value}
              setValue={setValue}
              linkTo={props.linkTo}
            />
            )
          </>
        )
      ),
      selector(
        props.value,
        props.setValue,
        "relations",
        "relation",
        true,
        {},
        (name, value, setValue) => (
          <>
            {name} (
            <RelationSelector
              types={info.data?.relations}
              value={value}
              setValue={setValue}
              linkTo={props.linkTo}
            />
            )
          </>
        )
      ),
      props.value.properties
        ? Object.entries(props.value.properties).map(([prop, selector], i) => (
          <Fragment key={`property ${i}`}>
            <Link to={props.linkTo("property", prop)}>{prop}</Link> ={" "}
            {JSON.stringify(selector)}
          </Fragment>
        ))
        : [],
    ].flat()
  );
}

function RelationSelector(props: {
  types?: string[] | null;
  value: components["schemas"]["RelationSelector"];
  linkTo: (type: string, name: string) => string;
  setValue?: (newValue: components["schemas"]["RelationSelector"]) => void;
}) {
  const ctx = {
    relation:
      getSelectedTypes(props.value.relation_type) || props.types || null,
  };
  const info = useQuery({
    queryKey: ([QueryKey.SelectorCtx] as string[]).concat(
      selectorCtxQueryKey(ctx)
    ),
    queryFn: async () => {
      return props.setValue
        ? await rg.post("/api/types/selector", {
          body: ctx,
        })
        : null;
    },
    enabled: !!props.setValue,
  });

  return intersperse(
    ", ",
    [
      selector(
        props.value,
        props.setValue,
        "relation_id",
        "id",
        false,
        { is: "" },
        (name, value, setValue) => (
          <Selector name={name} value={value} setValue={setValue} />
        )
      ),
      selector(
        props.value,
        props.setValue,
        "relation_type",
        "type",
        true,
        { is: "" },
        (name, value, setValue) => (
          <Selector
            name={name}
            value={value}
            setValue={setValue}
            options={props.types}
          />
        )
      ),
      selector(
        props.value,
        props.setValue,
        "item",
        "item",
        true,
        {},
        (name, value, setValue) => (
          <>
            {name} (
            {
              <ItemSelector
                types={info.data?.items}
                value={value}
                setValue={setValue}
                linkTo={props.linkTo}
              />
            }
            )
          </>
        )
      ),
      selector(
        props.value,
        props.setValue,
        "endpoint",
        "endpoint",
        true,
        "source",
        (name, value, setValue) => (
          <>
            {name} <SelectEndpoint value={value} setValue={setValue} />
          </>
        )
      ),
      props.value.properties
        ? Object.entries(props.value.properties).map(([prop, selector], i) => (
          <Fragment key={`property ${i}`}>
            <Link to={props.linkTo("property", prop)}>{prop}</Link> ={" "}
            {JSON.stringify(selector)}
          </Fragment>
        ))
        : [],
    ].flat()
  );
}

function SelectEndpoint(props: {
  value: components["schemas"]["Endpoint"];
  setValue?: (newValue: components["schemas"]["Endpoint"]) => void;
}) {
  return props.setValue ? (
    <Select
      size="small"
      MenuProps={{ disablePortal: true }}
      value={props.value}
      onChange={(ev) => {
        if (props.setValue) {
          props.setValue(ev.target.value as components["schemas"]["Endpoint"]);
        }
      }}
    >
      {["source", "target"].map((ep) => (
        <MenuItem key={ep} value={ep}>
          {ep}
        </MenuItem>
      ))}
    </Select>
  ) : (
    props.value
  );
}

function Selector(props: {
  name: string;
  options?: string[] | null;
  value: components["schemas"]["ItemTypeSelector"];
  linkTo?: (name: string) => string;
  setValue?: (newValue: components["schemas"]["ItemTypeSelector"]) => void;
}) {
  const link = (val: string) =>
    props.linkTo ? <Link to={props.linkTo(val)}>{val}</Link> : val;
  if (props.setValue) {
    if (props.options) {
      return (
        <>
          {props.name} ={" "}
          <Select
            size="small"
            MenuProps={{ disablePortal: true }}
            value={"is" in props.value ? props.value.is : ""}
            onChange={(ev) => {
              if (props.setValue) {
                props.setValue({ is: ev.target.value });
              }
            }}
          >
            {props.options.map((key) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </>
      );
    } else {
      return (
        <>
          {props.name} ={" "}
          <TextField
            size="small"
            value={"is" in props.value ? props.value.is : ""}
          />
        </>
      );
    }
  } else {
    return "is" in props.value ? (
      <>
        {props.name} = {link(props.value.is)}
      </>
    ) : "in" in props.value ? (
      <>
        {props.name} in [{intersperse(", ", props.value.in.map(link))}]
      </>
    ) : (
      <>
        ${props.value.template} = {props.name}
      </>
    );
  }
}

function intersperse<S, T>(sep: S, elems: T[]): (S | T)[] {
  return elems.flatMap((elem, i) => (i > 0 ? [sep, elem] : [elem]));
}
