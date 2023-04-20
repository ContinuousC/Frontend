/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

export default function Error500Page() {
  return (
    <div className="text-center">
      <h1 className="mt-5 text-[36px] font-bold lg:text-[50px]">
        500 - Server error
      </h1>
      <p className="mt-5 lg:text-lg">
        Oops something went wrong. Try to refresh this page or <br></br> feel
        free to contact us if the problem presists.
      </p>
    </div>
  );
}
