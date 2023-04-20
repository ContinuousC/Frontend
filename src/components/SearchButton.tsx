/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import { ChangeEvent, useState } from "react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Search from "@mui/icons-material/Search";
import Close from "@mui/icons-material/Close";

interface SearchButtonProps {
  initialValue: string;
  onChange: (searchValue: string | null) => void;
}

export default function SearchButton(props: SearchButtonProps) {
  const [value, setValue] = useState<string>(props.initialValue);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    props.onChange(event.target.value);
  };
  const handleClear = () => {
    setValue("");
    props.onChange(null);
  };

  return (
    <TextField
      placeholder={"Search by name"}
      value={value}
      onChange={handleChange}
      variant="standard"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Tooltip arrow title={"Search by name"}>
              <IconButton
                aria-label={"Search by name"}
                size="small"
                sx={{ height: "1.75rem", width: "1.75rem" }}
              >
                <Search />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip arrow title={"Clear Search"}>
              <span>
                <IconButton
                  aria-label={"Clear Search"}
                  onClick={handleClear}
                  size="small"
                >
                  <Close />
                </IconButton>
              </span>
            </Tooltip>
          </InputAdornment>
        ),
      }}
    />
  );
}
